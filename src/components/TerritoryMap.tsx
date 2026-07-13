"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import { statusMeta } from "@/lib/constants";
import type { ProspectDTO } from "./TerritoryClient";

// Pin radius grows (log scale) with the deal-value estimate.
function radiusFor(deal: number | null): number {
  if (!deal || deal <= 0) return 7;
  return 8 + Math.min(14, Math.log10(deal) * 3);
}

// Faded pins = stale accounts that need attention (low health score).
function fillOpacityFor(health: number): number {
  return 0.2 + (health / 100) * 0.65;
}

function FitBounds({ points }: { points: ProspectDTO[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(
      points.map((p) => [p.lat as number, p.lng as number]),
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
  }, [map, points]);
  return null;
}

export function TerritoryMap({
  prospects,
  selectedId,
  onSelect,
  routeMode = false,
  routeIds = [],
}: {
  prospects: ProspectDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  routeMode?: boolean;
  routeIds?: string[];
}) {
  const points = prospects.filter(
    (p) => p.lat != null && p.lng != null,
  );

  // Ordered coordinates of the in-progress route, for numbering + polyline.
  const orderById = new Map(routeIds.map((id, i) => [id, i]));
  const line = routeIds
    .map((id) => points.find((p) => p.id === id))
    .filter((p): p is ProspectDTO => !!p)
    .map((p) => [p.lat as number, p.lng as number] as [number, number]);

  return (
    <MapContainer
      center={[42.5, -84]}
      zoom={6}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {line.length >= 2 && (
        <Polyline
          positions={line}
          pathOptions={{ color: "#0f172a", weight: 3, dashArray: "6 6" }}
        />
      )}
      {points.map((p) => {
        const color = statusMeta(p.status).color;
        const inRoute = orderById.has(p.id);
        const selected = routeMode ? inRoute : p.id === selectedId;
        return (
          <CircleMarker
            key={p.id}
            center={[p.lat as number, p.lng as number]}
            radius={radiusFor(p.dealValueEstimate)}
            pathOptions={{
              color: selected ? "#0f172a" : color,
              weight: selected ? 3 : 1.5,
              fillColor: color,
              fillOpacity: fillOpacityFor(p.health),
            }}
            eventHandlers={{ click: () => onSelect(p.id) }}
          >
            <Tooltip
              direction="top"
              offset={[0, -4]}
              permanent={routeMode && inRoute}
            >
              <span className="font-medium">
                {routeMode && inRoute
                  ? `${(orderById.get(p.id) as number) + 1}. ${p.name}`
                  : p.name}
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
