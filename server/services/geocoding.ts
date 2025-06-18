import { GeocodingResult } from "@shared/schema";

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  place_id: string;
  importance: number;
}

export class GeocodingService {
  private baseUrl = 'https://nominatim.openstreetmap.org';

  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `${this.baseUrl}/search?q=${encodedAddress}&format=json&limit=1&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TSP-Route-Optimizer/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data: NominatimResponse[] = await response.json();
      
      if (data.length === 0) {
        return null;
      }

      const result = data[0];
      return {
        address,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/reverse?lat=${latitude}&lon=${longitude}&format=json`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TSP-Route-Optimizer/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.display_name || null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();
