"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Modal } from "./Modal";
import { ProspectForm } from "./ProspectForm";
import { DeleteButton } from "./DeleteButton";
import {
  PROSPECT_STATUSES,
  PROSPECT_VERTICALS,
  VISIT_TYPES,
  statusMeta,
  visitTypeMeta,
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

export type VisitDTO = {
  id: string;
  type: string;
  notes: string | null;
  date: string;
  xpAwarded: number;
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
  const [tab, setTab] = useState<"timeline" | "info">("timeline");

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
          onSelect={(id) => {
            setSelectedId(id);
            setTab("timeline");
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

        {selected && (
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

function ProspectDrawer({
  prospect,
  tab,
  setTab,
  onClose,
}: {
  prospect: ProspectDTO;
  tab: "timeline" | "info";
  setTab: (t: "timeline" | "info") => void;
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
        {(["timeline", "info"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium capitalize ${
              tab === t
                ? "border-b-2 border-brand-600 text-brand-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "timeline" ? "Notes / Timeline" : "Info"}
          </button>
        ))}
      </div>

      {tab === "timeline" ? (
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
      ) : (
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

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="text-slate-700">{value ?? "—"}</div>
    </div>
  );
}
