import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MapPin, Clipboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GeocodingResult } from "@shared/schema";

export default function AddressInput() {
  const [inputValue, setInputValue] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { toast } = useToast();

  const addAddressMutation = useMutation({
    mutationFn: async (addressData: {
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      verified: boolean;
    }) => {
      const response = await apiRequest('POST', '/api/addresses', addressData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      setInputValue("");
      toast({
        title: "Address Added",
        description: "Address has been successfully added and verified",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Address",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleAddAddress = async () => {
    if (!inputValue.trim()) return;

    setIsGeocoding(true);
    try {
      const response = await apiRequest('POST', '/api/geocode', { address: inputValue });
      const geocodingResult: GeocodingResult = await response.json();

      await addAddressMutation.mutateAsync({
        name: geocodingResult.displayName.split(',')[0], // Use first part as name
        address: geocodingResult.displayName,
        latitude: geocodingResult.latitude,
        longitude: geocodingResult.longitude,
        verified: true,
      });
    } catch (error: any) {
      toast({
        title: "Geocoding Failed",
        description: "Could not find the address. Please check and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
            headers: {
              'User-Agent': 'TSP-Route-Optimizer/1.0'
            }
          });
          const data = await response.json();
          
          await addAddressMutation.mutateAsync({
            name: "Current Location",
            address: data.display_name || `${latitude}, ${longitude}`,
            latitude,
            longitude,
            verified: true,
          });
        } catch (error) {
          toast({
            title: "Failed to Get Location",
            description: "Could not determine your current address",
            variant: "destructive",
          });
        }
      },
      (error) => {
        toast({
          title: "Location Access Denied",
          description: "Please allow location access to use this feature",
          variant: "destructive",
        });
      }
    );
  };

  const handlePasteAddresses = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        toast({
          title: "No Addresses Found",
          description: "Please copy addresses to your clipboard first",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Processing Addresses",
        description: `Processing ${lines.length} addresses...`,
      });

      // Process addresses one by one
      for (const line of lines) {
        try {
          const response = await apiRequest('POST', '/api/geocode', { address: line.trim() });
          const geocodingResult: GeocodingResult = await response.json();

          await addAddressMutation.mutateAsync({
            name: geocodingResult.displayName.split(',')[0],
            address: geocodingResult.displayName,
            latitude: geocodingResult.latitude,
            longitude: geocodingResult.longitude,
            verified: true,
          });
        } catch (error) {
          console.error(`Failed to geocode: ${line}`);
        }
      }
    } catch (error) {
      toast({
        title: "Clipboard Access Failed",
        description: "Could not read from clipboard",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddAddress();
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type="text"
          placeholder="Enter address or location..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pr-10"
        />
        <Button
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          onClick={handleAddAddress}
          disabled={!inputValue.trim() || isGeocoding || addAddressMutation.isPending}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={handleUseCurrentLocation}
        >
          <MapPin className="w-3 h-3 mr-1" />
          Current Location
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={handlePasteAddresses}
        >
          <Clipboard className="w-3 h-3 mr-1" />
          Paste List
        </Button>
      </div>
    </div>
  );
}
