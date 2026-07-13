"use client";

import { PROSPECT_STATUSES, PROSPECT_VERTICALS } from "@/lib/constants";

export function ProspectForm({
  action,
  defaults,
  submitLabel,
  onDone,
}: {
  action: (fd: FormData) => Promise<void>;
  defaults?: Record<string, string | null | undefined>;
  submitLabel: string;
  onDone?: () => void;
}) {
  return (
    <form
      action={async (fd) => {
        await action(fd);
        onDone?.();
      }}
      className="space-y-4"
    >
      <div>
        <label className="label">Company name *</label>
        <input
          name="name"
          required
          defaultValue={defaults?.name ?? ""}
          className="input"
        />
      </div>
      <div>
        <label className="label">Address</label>
        <input
          name="address"
          defaultValue={defaults?.address ?? ""}
          placeholder="123 Main St, Detroit, MI"
          className="input"
        />
        <p className="mt-1 text-xs text-slate-400">
          A full address is geocoded to a map pin automatically.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Status</label>
          <select
            name="status"
            defaultValue={defaults?.status ?? "cold"}
            className="input"
          >
            {PROSPECT_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Vertical</label>
          <select
            name="vertical"
            defaultValue={defaults?.vertical ?? ""}
            className="input"
          >
            <option value="">— select —</option>
            {PROSPECT_VERTICALS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Est. deal value ($)</label>
        <input
          name="dealValueEstimate"
          type="number"
          min={0}
          step={100}
          defaultValue={defaults?.dealValueEstimate ?? ""}
          className="input"
        />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea
          name="notes"
          defaultValue={defaults?.notes ?? ""}
          className="input min-h-[60px]"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
