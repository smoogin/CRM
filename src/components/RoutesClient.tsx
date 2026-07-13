"use client";

import { useTransition } from "react";
import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/constants";
import { googleMapsUrl } from "@/lib/route";
import { deleteRoute, toggleRouteStop } from "@/lib/actions/routes";

type StopDTO = {
  id: string;
  order: number;
  done: boolean;
  prospectName: string;
  county: string | null;
  lat: number | null;
  lng: number | null;
};

type RouteDTO = {
  id: string;
  name: string | null;
  date: string;
  optimized: boolean;
  distanceMiles: number | null;
  stops: StopDTO[];
};

export function RoutesClient({ routes }: { routes: RouteDTO[] }) {
  return (
    <div>
      <PageHeader
        title="Routes"
        subtitle="Saved day plans — tick off stops as you go"
        action={
          <Link href="/territory" className="btn-ghost">
            ← Map
          </Link>
        }
      />
      <div className="space-y-6 p-8">
        {routes.length === 0 ? (
          <EmptyState
            title="No routes yet"
            hint='Build one from the map with "Plan route".'
          />
        ) : (
          routes.map((r) => <RouteCard key={r.id} route={r} />)
        )}
      </div>
    </div>
  );
}

function RouteCard({ route }: { route: RouteDTO }) {
  const [pending, start] = useTransition();
  const doneCount = route.stops.filter((s) => s.done).length;
  const mapped = route.stops.filter((s) => s.lat != null && s.lng != null);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            {route.name ?? formatDate(route.date)}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDate(route.date)} · {route.stops.length} stops
            {route.distanceMiles != null && ` · ~${route.distanceMiles} mi`}
            {route.optimized && (
              <span className="ml-1 text-emerald-600">· optimized</span>
            )}
            {" · "}
            {doneCount}/{route.stops.length} done
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mapped.length >= 1 && (
            <a
              className="btn-ghost"
              href={googleMapsUrl(
                mapped.map((s) => ({ lat: s.lat as number, lng: s.lng as number })),
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Maps
            </a>
          )}
          <button
            className="btn-ghost text-slate-400 hover:text-red-600"
            disabled={pending}
            onClick={() => {
              if (confirm("Delete this route?"))
                start(() => deleteRoute(route.id));
            }}
            aria-label="Delete route"
          >
            ✕
          </button>
        </div>
      </div>
      <ul className="divide-y divide-slate-100">
        {route.stops.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-5 py-3">
            <input
              type="checkbox"
              checked={s.done}
              onChange={(e) => start(() => toggleRouteStop(s.id, e.target.checked))}
              className="h-4 w-4"
            />
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
              {s.order + 1}
            </span>
            <span
              className={`flex-1 text-sm ${
                s.done ? "text-slate-400 line-through" : "text-slate-700"
              }`}
            >
              {s.prospectName}
            </span>
            {s.county && (
              <span className="text-xs text-slate-400">{s.county} County</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
