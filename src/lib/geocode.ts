// Free geocoding via OpenStreetMap Nominatim (no API key). Nominatim asks for a
// descriptive User-Agent and rate-limits to ~1 req/sec, which is fine for the
// manual add/edit flow. Returns null on any failure so callers degrade to a
// pin-less prospect.
export type GeocodeResult = {
  lat: number;
  lng: number;
  county: string | null;
};

export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | null> {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      format: "jsonv2",
      q: address,
      limit: "1",
      addressdetails: "1",
      countrycodes: "us",
    }).toString();

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "PackagingCRM/1.0 (territory geocoder)" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      address?: { county?: string };
    }>;
    const hit = data[0];
    if (!hit) return null;
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, county: hit.address?.county ?? null };
  } catch {
    return null;
  }
}
