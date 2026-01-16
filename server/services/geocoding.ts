import { GeocodingResult } from "@shared/schema";

interface NominatimGeocodeResponse {
  lat: string;
  lon: string;
  display_name: string;
}

interface NominatimReverseResponse {
  display_name: string;
}

export class GeocodingService {
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

      console.log(`Geocoding request: ${url}`);
      const response = await fetch(url);

      console.log(`Geocoding response status: ${response.status}`);
      if (!response.ok) {
        console.error(`Geocoding API request failed: ${response.status} - ${response.statusText}`);
        return null;
      }

      const data: NominatimGeocodeResponse[] = await response.json();
      console.log(`Geocoding results: ${data.length}`);

      if (data.length === 0) {
        console.log(`No geocoding results for address: ${address}`);
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
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

      console.log(`Reverse geocoding request: ${url}`);
      const response = await fetch(url);

      console.log(`Reverse geocoding response status: ${response.status}`);
      if (!response.ok) {
        console.error(`Reverse geocoding API request failed: ${response.status} - ${response.statusText}`);
        return null;
      }

      const data: NominatimReverseResponse = await response.json();
      console.log(`Reverse geocoding result: ${data.display_name ? 'found' : 'not found'}`);

      if (!data.display_name) {
        console.log(`No reverse geocoding results for coordinates: ${latitude}, ${longitude}`);
        return null;
      }

      return data.display_name;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();
