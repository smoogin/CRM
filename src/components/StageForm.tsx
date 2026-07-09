"use client";

import { useState } from "react";
import { STAGE_CATEGORIES, STAGE_COLORS } from "@/lib/constants";

export function StageForm({
  action,
  defaults,
  submitLabel,
  onDone,
}: {
  action: (fd: FormData) => Promise<void>;
  defaults?: { name?: string; color?: string; category?: string };
  submitLabel: string;
  onDone?: () => void;
}) {
  const [color, setColor] = useState(defaults?.color ?? STAGE_COLORS[0]);

  return (
    <form
      action={async (fd) => {
        await action(fd);
        onDone?.();
      }}
      className="space-y-4"
    >
      <div>
        <label className="label">Stage name *</label>
        <input
          name="name"
          required
          defaultValue={defaults?.name ?? ""}
          className="input"
          placeholder="e.g. Negotiation"
        />
      </div>

      <div>
        <label className="label">Color</label>
        <input type="hidden" name="color" value={color} />
        <div className="flex flex-wrap gap-2">
          {STAGE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              className={`h-7 w-7 rounded-full transition ${
                color === c
                  ? "ring-2 ring-slate-800 ring-offset-2"
                  : "ring-1 ring-slate-200"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="label">Category</label>
        <select
          name="category"
          defaultValue={defaults?.category ?? "OPEN"}
          className="input"
        >
          {STAGE_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-400">
          Controls how the dashboard rolls up pipeline vs. won revenue.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
