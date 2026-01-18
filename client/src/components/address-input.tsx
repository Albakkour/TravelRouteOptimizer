import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MapPin, Clipboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

/* -------------------------------
   Frontend-only DTO
-------------------------------- */
interface GeocodingResult {
  address: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

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
      const response = await apiRequest(
        "POST",
        "/api/addresses",
        addressData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setInputValue("");
      toast({
        title: "Address Added",
        description: "Address has been added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Add Address",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  /* -------------------------------
     Add address by text
  -------------------------------- */
  const handleAddAddress = async () => {
    if (!inputValue.trim()) return;

    setIsGeocoding(true);
    try {
      const response = await apiRequest("POST", "/api/geocode", {
        address: inputValue,
      });

      const geocodingResult: GeocodingResult = await response.json();

      await addAddressMutation.mutateAsync({
        name: geocodingResult.displayName.split(",")[0],
        address: geocodingResult.displayName,
        latitude: geocodingResult.latitude,
        longitude: geocodingResult.longitude,
        verified: true,
      });
    } catch {
      toast({
        title: "Geocoding Failed",
        description: "Could not find the address",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  /* -------------------------------
     Use browser location
     (BACKEND reverse-geocode)
  -------------------------------- */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser does not support location access",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await apiRequest(
            "POST",
            "/api/reverse-geocode",
            { latitude, longitude }
          );

          const data = await response.json();

          await addAddressMutation.mutateAsync({
            name: "Current Location",
            address: data.address,
            latitude,
            longitude,
            verified: true,
          });
        } catch {
          toast({
            title: "Failed to Get Location",
            description: "Could not determine address",
            variant: "destructive",
          });
        }
      },
      () => {
        toast({
          title: "Location Access Denied",
          description: "Please allow location access",
          variant: "destructive",
        });
      }
    );
  };

  /* -------------------------------
     Paste multiple addresses
  -------------------------------- */
  const handlePasteAddresses = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const response = await apiRequest("POST", "/api/geocode", {
            address: line.trim(),
          });

          const geocodingResult: GeocodingResult =
            await response.json();

          await addAddressMutation.mutateAsync({
            name: geocodingResult.displayName.split(",")[0],
            address: geocodingResult.displayName,
            latitude: geocodingResult.latitude,
            longitude: geocodingResult.longitude,
            verified: true,
          });
        } catch {
          console.error(`Failed to geocode: ${line}`);
        }
      }
    } catch {
      toast({
        title: "Clipboard Error",
        description: "Could not read clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={inputValue}
          placeholder="Enter address..."
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddAddress()}
        />
        <Button
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          onClick={handleAddAddress}
          disabled={isGeocoding}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={handleUseCurrentLocation}>
          <MapPin className="w-3 h-3 mr-1" />
          Current Location
        </Button>
        <Button variant="secondary" onClick={handlePasteAddresses}>
          <Clipboard className="w-3 h-3 mr-1" />
          Paste List
        </Button>
      </div>
    </div>
  );
}
