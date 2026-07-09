"use client";

import { PRIORITIES } from "@/lib/constants";

type Option = { id: string; label: string };

export function ProjectForm({
  action,
  companies,
  contacts,
  stages,
  defaults,
  submitLabel,
  onDone,
}: {
  action: (formData: FormData) => Promise<void>;
  companies: Option[];
  contacts: Option[];
  stages: Option[];
  defaults?: {
    name?: string;
    description?: string | null;
    stageId?: string;
    priority?: string;
    quantity?: number | null;
    targetDate?: string | null;
    companyId?: string | null;
    contactId?: string | null;
    estRevenue?: number | null;
    estCost?: number | null;
  };
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
        <label className="label">Project name *</label>
        <input
          name="name"
          required
          defaultValue={defaults?.name}
          className="input"
          placeholder="e.g. Retail carton redesign"
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          name="description"
          defaultValue={defaults?.description ?? ""}
          className="input min-h-[70px]"
          placeholder="Scope, specs, notes…"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Stage</label>
          <select
            name="stageId"
            defaultValue={defaults?.stageId ?? stages[0]?.id ?? ""}
            className="input"
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select
            name="priority"
            defaultValue={defaults?.priority ?? "MEDIUM"}
            className="input"
          >
            {PRIORITIES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Company</label>
          <select name="companyId" defaultValue={defaults?.companyId ?? ""} className="input">
            <option value="">— none —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Contact</label>
          <select name="contactId" defaultValue={defaults?.contactId ?? ""} className="input">
            <option value="">— none —</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Quantity</label>
          <input
            name="quantity"
            type="number"
            defaultValue={defaults?.quantity ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label">Est. revenue ($)</label>
          <input
            name="estRevenue"
            type="number"
            step="0.01"
            defaultValue={defaults?.estRevenue ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label">Est. cost ($)</label>
          <input
            name="estCost"
            type="number"
            step="0.01"
            defaultValue={defaults?.estCost ?? ""}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">Target date</label>
        <input
          name="targetDate"
          type="date"
          defaultValue={defaults?.targetDate ?? ""}
          className="input"
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
