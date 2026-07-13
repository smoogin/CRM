// Route planning helpers — pure functions, no external calls.
// Optimization uses a nearest-neighbor heuristic over straight-line
// (haversine) distance: free, instant, good enough for a day of stops.

export type LatLng = { lat: number; lng: number };

const EARTH_MI = 3958.8;

export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_MI * Math.asin(Math.sqrt(h));
}

// Total straight-line distance across an ordered list of stops.
export function routeMiles(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMiles(points[i - 1], points[i]);
  }
  return Math.round(total * 10) / 10;
}

// Greedy nearest-neighbor ordering. Keeps the first stop as the start
// (the anchor of the day) and repeatedly hops to the closest unvisited stop.
export function optimizeOrder<T extends LatLng>(stops: T[]): T[] {
  if (stops.length <= 2) return stops.slice();
  const remaining = stops.slice();
  const ordered: T[] = [remaining.shift() as T];
  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineMiles(last, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    ordered.push(remaining.splice(best, 1)[0]);
  }
  return ordered;
}

// Google Maps directions URL for the ordered stops (no API key needed).
export function googleMapsUrl(points: LatLng[]): string {
  const coords = points.map((p) => `${p.lat},${p.lng}`);
  return `https://www.google.com/maps/dir/${coords.join("/")}`;
}
