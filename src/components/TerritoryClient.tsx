"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Modal } from "./Modal";
import { ProspectForm } from "./ProspectForm";
import { DeleteButton } from "./DeleteButton";
import {
  PROSPECT_STATUSES,
  PROSPECT_VERTICALS,
  VISIT_TYPES,
  PACKAGING_TYPES,
  EXPENSE_TYPES,
  MILEAGE_RATE,
  statusMeta,
  visitTypeMeta,
  expenseTypeMeta,
  healthMeta,
  formatDate,
  formatCurrency,
} from "@/lib/constants";
import {
  createProspect,
  updateProspect,
  deleteProspect,
  addVisitLog,
  deleteVisitLog,
} from "@/lib/actions/territory";
import { addInventoryItem, deleteInventoryItem } from "@/lib/actions/inventory";
import { addExpense, deleteExpense } from "@/lib/actions/expenses";
import { createRoute } from "@/lib/actions/routes";
import { optimizeOrder, routeMiles, googleMapsUrl } from "@/lib/route";

type Tab = "timeline" | "inventory" | "spending" | "info";

export type VisitDTO = {
  id: string;
  type: string;
  notes: string | null;
  date: string;
  xpAwarded: number;
};

export type InventoryDTO = {
  id: string;
  packagingType: string;
  notes: string | null;
  hasPhoto: boolean;
  dateCaptured: string;
};

export type ExpenseDTO = {
  id: string;
  type: string;
  amount: number;
  miles: number | null;
  notes: string | null;
  date: string;
};

export type ProspectDTO = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  county: string | null;
  status: string;
  vertical: string | null;
  dealValueEstimate: number | null;
  lastContactDate: string | null;
  notes: string | null;
  health: number;
  visits: VisitDTO[];
  inventory: InventoryDTO[];
  expenses: ExpenseDTO[];
};

// Leaflet touches `window`, so the map must be client-only (no SSR).
const TerritoryMap = dynamic(
  () => import("./TerritoryMap").then((m) => m.TerritoryMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
        Loading map…
      </div>
    ),
  },
);

function StatusBadge({ status }: { status: string }) {
  const m = statusMeta(status);
  return (
    <span
      className="badge"
      style={{ backgroundColor: `${m.color}1a`, color: m.color }}
    >
      {m.label}
    </span>
  );
}

export function TerritoryClient({ prospects }: { prospects: ProspectDTO[] }) {
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [vertical, setVertical] = useState("");
  const [county, setCounty] = useState("");
  const [needsAttention, setNeedsAttention] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("timeline");
  const [routeMode, setRouteMode] = useState(false);
  const [routeIds, setRouteIds] = useState<string[]>([]);

  function toggleRouteStop(id: string) {
    setRouteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const counties = useMemo(
    () =>
      Array.from(
        new Set(prospects.map((p) => p.county).filter(Boolean) as string[]),
      ).sort(),
    [prospects],
  );

  const filtered = useMemo(
    () =>
      prospects.filter((p) => {
        if (statusFilter.size && !statusFilter.has(p.status)) return false;
        if (vertical && p.vertical !== vertical) return false;
        if (county && p.county !== county) return false;
        if (needsAttention && p.health >= 40) return false;
        return true;
      }),
    [prospects, statusFilter, vertical, county, needsAttention],
  );

  const selected = prospects.find((p) => p.id === selectedId) ?? null;
  const unmapped = filtered.filter((p) => p.lat == null || p.lng == null);

  function toggleStatus(key: string) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Territory</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {prospects.length} prospects · {filtered.length} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/territory/routes" className="btn-ghost">
            Routes
          </Link>
          <Link href="/territory/spending" className="btn-ghost">
            Spending report
          </Link>
          <button
            className={routeMode ? "btn-primary" : "btn-ghost"}
            onClick={() => {
              setRouteMode((m) => !m);
              setSelectedId(null);
            }}
          >
            {routeMode ? "Exit route" : "Plan route"}
          </button>
          <Modal
            title="Add prospect"
            trigger={(open) => (
              <button className="btn-primary" onClick={open}>
                + Add prospect
              </button>
            )}
          >
            {(close) => (
              <ProspectForm
                action={createProspect}
                submitLabel="Add prospect"
                onDone={close}
              />
            )}
          </Modal>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex flex-wrap gap-1.5">
          {PROSPECT_STATUSES.map((s) => {
            const on = statusFilter.has(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggleStatus(s.key)}
                className="badge border transition-colors"
                style={{
                  backgroundColor: on ? `${s.color}1a` : "transparent",
                  color: on ? s.color : "#64748b",
                  borderColor: on ? s.color : "#e2e8f0",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <select
          value={vertical}
          onChange={(e) => setVertical(e.target.value)}
          className="input h-8 w-auto py-1 text-xs"
        >
          <option value="">All verticals</option>
          {PROSPECT_VERTICALS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        {counties.length > 0 && (
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="input h-8 w-auto py-1 text-xs"
          >
            <option value="">All counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={needsAttention}
            onChange={(e) => setNeedsAttention(e.target.checked)}
          />
          Needs attention
        </label>
      </div>

      {/* Map + drawer */}
      <div className="relative flex-1 overflow-hidden">
        <TerritoryMap
          prospects={filtered}
          selectedId={selectedId}
          routeMode={routeMode}
          routeIds={routeIds}
          onSelect={(id) => {
            if (routeMode) {
              toggleRouteStop(id);
            } else {
              setSelectedId(id);
              setTab("timeline");
            }
          }}
        />

        {unmapped.length > 0 && (
          <div className="absolute bottom-3 left-3 z-[500] max-w-xs rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow">
            <span className="font-medium">{unmapped.length} unmapped</span>{" "}
            (no coordinates):{" "}
            {unmapped.map((p, i) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedId(p.id);
                  setTab("info");
                }}
                className="underline hover:no-underline"
              >
                {p.name}
                {i < unmapped.length - 1 ? ", " : ""}
              </button>
            ))}
          </div>
        )}

        {routeMode && (
          <RouteBuilderPanel
            prospects={prospects}
            routeIds={routeIds}
            setRouteIds={setRouteIds}
            onRemove={toggleRouteStop}
            onClose={() => {
              setRouteMode(false);
              setRouteIds([]);
            }}
          />
        )}

        {!routeMode && selected && (
          <ProspectDrawer
            prospect={selected}
            tab={tab}
            setTab={setTab}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}

function RouteBuilderPanel({
  prospects,
  routeIds,
  setRouteIds,
  onRemove,
  onClose,
}: {
  prospects: ProspectDTO[];
  routeIds: string[];
  setRouteIds: (ids: string[]) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [optimized, setOptimized] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  // Selected stops in current order (only those with coordinates count for
  // distance / optimization / Google Maps handoff).
  const stops = routeIds
    .map((id) => prospects.find((p) => p.id === id))
    .filter((p): p is ProspectDTO => !!p);
  const mapped = stops.filter((p) => p.lat != null && p.lng != null);
  const miles = mapped.length >= 2
    ? routeMiles(mapped.map((p) => ({ lat: p.lat as number, lng: p.lng as number })))
    : 0;

  function optimize() {
    const ordered = optimizeOrder(
      mapped.map((p) => ({ id: p.id, lat: p.lat as number, lng: p.lng as number })),
    );
    // Keep any coordinate-less stops at the end so they aren't dropped.
    const unmapped = stops.filter((p) => p.lat == null || p.lng == null);
    setRouteIds([...ordered.map((o) => o.id), ...unmapped.map((p) => p.id)]);
    setOptimized(true);
  }

  function save() {
    start(async () => {
      await createRoute({
        name: name.trim() || null,
        date,
        optimized,
        distanceMiles: miles || null,
        prospectIds: routeIds,
      });
      setSaved(true);
    });
  }

  return (
    <div className="absolute inset-y-0 right-0 z-[600] flex w-full max-w-md flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-xl">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Plan route</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Tap pins to add stops, then optimize the order.
          </p>
        </div>
        <button
          className="btn-ghost h-8 w-8 !px-0"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 px-5 py-4">
        {stops.length === 0 ? (
          <p className="text-sm text-slate-400">
            No stops yet. Click prospect pins on the map to add them.
          </p>
        ) : (
          <ol className="space-y-2">
            {stops.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {p.name}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {p.lat == null || p.lng == null
                      ? "No coordinates"
                      : p.county
                      ? `${p.county} County`
                      : p.address}
                  </p>
                </div>
                <button
                  className="btn-ghost text-slate-400 hover:text-red-600"
                  onClick={() => onRemove(p.id)}
                  aria-label={`Remove ${p.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>
        )}

        {stops.length > 0 && (
          <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                {stops.length} stop{stops.length === 1 ? "" : "s"}
              </span>
              <span className="font-semibold text-slate-700">
                {miles > 0 ? `~${miles} mi` : "—"}
                {optimized && (
                  <span className="ml-1 text-xs font-normal text-emerald-600">
                    optimized
                  </span>
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                className="btn-ghost flex-1"
                onClick={optimize}
                disabled={mapped.length < 3}
              >
                Optimize order
              </button>
              <a
                className="btn-ghost flex-1 text-center"
                href={mapped.length >= 1
                  ? googleMapsUrl(
                      mapped.map((p) => ({
                        lat: p.lat as number,
                        lng: p.lng as number,
                      })),
                    )
                  : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={mapped.length < 1}
              >
                Open in Maps
              </a>
            </div>
            <input
              className="input h-9 py-1 text-sm"
              placeholder={`Route name (default: ${date})`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
            />
            <input
              type="date"
              className="input h-9 py-1 text-sm"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSaved(false);
              }}
            />
            <button
              className="btn-primary w-full"
              onClick={save}
              disabled={pending || saved}
            >
              {saved ? "Saved ✓" : pending ? "Saving…" : "Save route"}
            </button>
            {saved && (
              <Link
                href="/territory/routes"
                className="block text-center text-xs text-brand-600 hover:underline"
              >
                View saved routes →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: "timeline", label: "Timeline" },
  { key: "inventory", label: "Inventory" },
  { key: "spending", label: "Spending" },
  { key: "info", label: "Info" },
];

function ProspectDrawer({
  prospect,
  tab,
  setTab,
  onClose,
}: {
  prospect: ProspectDTO;
  tab: Tab;
  setTab: (t: Tab) => void;
  onClose: () => void;
}) {
  const health = healthMeta(prospect.health);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="absolute inset-y-0 right-0 z-[600] flex w-full max-w-md flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-xl">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">{prospect.name}</h2>
            <StatusBadge status={prospect.status} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {prospect.vertical ?? "No vertical"}
            {prospect.county ? ` · ${prospect.county}` : ""}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="btn-ghost h-8 w-8 !px-0"
        >
          ✕
        </button>
      </div>

      {/* Health bar */}
      <div className="border-b border-slate-200 px-5 py-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">Health</span>
          <span style={{ color: health.color }}>
            {prospect.health} · {health.label}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full"
            style={{
              width: `${prospect.health}%`,
              backgroundColor: health.color,
            }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Last contact: {formatDate(prospect.lastContactDate)}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 px-3 pt-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium ${
              tab === t.key
                ? "border-b-2 border-brand-600 text-brand-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "timeline" && (
        <div className="flex-1 px-5 py-4">
          <form
            action={async (fd) => {
              await addVisitLog(prospect.id, fd);
            }}
            className="mb-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <div className="grid grid-cols-2 gap-2">
              <select name="type" className="input h-9 py-1 text-sm" required>
                {VISIT_TYPES.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                name="date"
                defaultValue={today}
                className="input h-9 py-1 text-sm"
              />
            </div>
            <textarea
              name="notes"
              placeholder="What happened? (optional)"
              className="input min-h-[54px] text-sm"
            />
            <div className="flex justify-end">
              <button type="submit" className="btn-primary">
                Log activity
              </button>
            </div>
          </form>

          {prospect.visits.length === 0 ? (
            <p className="text-sm text-slate-400">No activity logged yet.</p>
          ) : (
            <ul className="space-y-2">
              {prospect.visits.map((v) => (
                <li
                  key={v.id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-slate-700">
                      {visitTypeMeta(v.type).label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(v.date)}
                    </span>
                  </div>
                  {v.notes && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                      {v.notes}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-600">
                      +{v.xpAwarded} XP
                    </span>
                    <DeleteButton
                      small
                      label="Remove"
                      confirmText="Remove this activity entry?"
                      action={async () => {
                        await deleteVisitLog(v.id);
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "inventory" && (
        <InventoryPanel prospect={prospect} />
      )}

      {tab === "spending" && (
        <SpendingPanel prospect={prospect} today={today} />
      )}

      {tab === "info" && (
        <div className="flex-1 space-y-3 px-5 py-4 text-sm">
          <InfoRow label="Address" value={prospect.address} />
          <InfoRow label="County" value={prospect.county} />
          <InfoRow
            label="Est. deal value"
            value={
              prospect.dealValueEstimate != null
                ? formatCurrency(prospect.dealValueEstimate)
                : null
            }
          />
          {prospect.notes && (
            <div>
              <div className="label">Notes</div>
              <p className="whitespace-pre-wrap text-slate-700">
                {prospect.notes}
              </p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Modal
              title="Edit prospect"
              trigger={(open) => (
                <button className="btn-ghost" onClick={open}>
                  Edit
                </button>
              )}
            >
              {(close) => (
                <ProspectForm
                  action={updateProspect.bind(null, prospect.id)}
                  submitLabel="Save changes"
                  onDone={close}
                  defaults={{
                    name: prospect.name,
                    address: prospect.address,
                    status: prospect.status,
                    vertical: prospect.vertical,
                    dealValueEstimate:
                      prospect.dealValueEstimate != null
                        ? String(prospect.dealValueEstimate)
                        : "",
                    notes: prospect.notes,
                  }}
                />
              )}
            </Modal>
            <DeleteButton
              label="Delete prospect"
              confirmText={`Delete ${prospect.name}? This removes all its activity.`}
              action={async () => {
                await deleteProspect(prospect.id);
                onClose();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryPanel({ prospect }: { prospect: ProspectDTO }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    const notes = (
      e.currentTarget.elements.namedItem("notes") as HTMLTextAreaElement | null
    )?.value.trim();
    if (!file && !notes) {
      setError("Add a photo or a part number / description.");
      return;
    }
    if (file && file.size > 25 * 1024 * 1024) {
      setError("Photo is too large (25 MB max).");
      return;
    }
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("prospectId", prospect.id);
    start(async () => {
      await addInventoryItem(fd);
      formRef.current?.reset();
    });
  }

  return (
    <div className="flex-1 px-5 py-4">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="mb-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
      >
        <input
          ref={fileRef}
          type="file"
          name="photo"
          accept="image/*"
          className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-white"
        />
        <select
          name="packagingType"
          className="input h-9 py-1 text-sm"
          required
        >
          {PACKAGING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <textarea
          name="notes"
          placeholder="Part number, spec, or description"
          className="input min-h-[48px] text-sm"
        />
        <p className="text-[10px] text-slate-400">
          Photo optional — a part number or description is enough.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Add item"}
          </button>
        </div>
      </form>

      {prospect.inventory.length === 0 ? (
        <p className="text-sm text-slate-400">No packaging captured yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {prospect.inventory.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-lg border border-slate-200"
            >
              {item.hasPhoto ? (
                <a
                  href={`/api/inventory/${item.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/inventory/${item.id}`}
                    alt={item.packagingType}
                    className="h-28 w-full object-cover"
                  />
                </a>
              ) : (
                <div className="flex h-28 w-full items-center justify-center bg-slate-50 text-3xl text-slate-300">
                  📦
                </div>
              )}
              <div className="p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    {item.packagingType}
                  </span>
                  <DeleteButton
                    small
                    label="✕"
                    confirmText="Delete this inventory photo?"
                    action={async () => {
                      await deleteInventoryItem(item.id);
                    }}
                  />
                </div>
                {item.notes && (
                  <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                )}
                <p className="mt-1 text-[10px] text-slate-400">
                  {formatDate(item.dateCaptured)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SpendingPanel({
  prospect,
  today,
}: {
  prospect: ProspectDTO;
  today: string;
}) {
  const [type, setType] = useState("gas");
  const total = prospect.expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex-1 px-5 py-4">
      <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
        <span className="text-sm text-slate-600">Total spent here</span>
        <span className="text-sm font-bold text-slate-800">
          {formatCurrency(total)}
        </span>
      </div>

      <form
        action={async (fd) => {
          await addExpense(fd);
        }}
        className="mb-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
      >
        <input type="hidden" name="prospectId" value={prospect.id} />
        <div className="grid grid-cols-2 gap-2">
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input h-9 py-1 text-sm"
          >
            {EXPENSE_TYPES.map((e) => (
              <option key={e.key} value={e.key}>
                {e.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="date"
            defaultValue={today}
            className="input h-9 py-1 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0"
            placeholder="Amount $"
            className="input h-9 py-1 text-sm"
          />
          {type === "gas" && (
            <input
              type="number"
              name="miles"
              step="0.1"
              min="0"
              placeholder="Miles"
              className="input h-9 py-1 text-sm"
            />
          )}
        </div>
        {type === "gas" && (
          <p className="text-[11px] text-slate-400">
            Leave amount blank to auto-calc from miles at ${MILEAGE_RATE}/mi.
          </p>
        )}
        <textarea
          name="notes"
          placeholder="Notes (optional)"
          className="input min-h-[42px] text-sm"
        />
        <div className="flex justify-end">
          <button type="submit" className="btn-primary">
            Log expense
          </button>
        </div>
      </form>

      {prospect.expenses.length === 0 ? (
        <p className="text-sm text-slate-400">No expenses logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {prospect.expenses.map((e) => {
            const m = expenseTypeMeta(e.type);
            return (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="badge"
                      style={{ backgroundColor: `${m.color}1a`, color: m.color }}
                    >
                      {m.label}
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {formatCurrency(e.amount)}
                    </span>
                  </div>
                  {e.notes && (
                    <p className="mt-1 text-xs text-slate-500">{e.notes}</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDate(e.date)}
                    {e.miles != null ? ` · ${e.miles} mi` : ""}
                  </p>
                </div>
                <DeleteButton
                  small
                  label="✕"
                  confirmText="Delete this expense?"
                  action={async () => {
                    await deleteExpense(e.id);
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="text-slate-700">{value ?? "—"}</div>
    </div>
  );
}
