"use client";

import { VENDOR_CATEGORIES } from "@/lib/constants";

type Option = { id: string; label: string };

function Actions({ label, onDone }: { label: string; onDone?: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="submit" className="btn-primary">
        {label}
      </button>
    </div>
  );
}

export function CompanyForm({
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
        <input name="name" required defaultValue={defaults?.name ?? ""} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Industry</label>
          <input name="industry" defaultValue={defaults?.industry ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" defaultValue={defaults?.phone ?? ""} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Website</label>
        <input name="website" defaultValue={defaults?.website ?? ""} className="input" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className="label">Address</label>
          <input name="address" defaultValue={defaults?.address ?? ""} className="input" />
        </div>
        <div>
          <label className="label">City</label>
          <input name="city" defaultValue={defaults?.city ?? ""} className="input" />
        </div>
        <div>
          <label className="label">State</label>
          <input name="state" defaultValue={defaults?.state ?? ""} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea name="notes" defaultValue={defaults?.notes ?? ""} className="input min-h-[60px]" />
      </div>
      <Actions label={submitLabel} onDone={onDone} />
    </form>
  );
}

export function ContactForm({
  action,
  companies,
  defaults,
  submitLabel,
  onDone,
}: {
  action: (fd: FormData) => Promise<void>;
  companies: Option[];
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">First name *</label>
          <input name="firstName" required defaultValue={defaults?.firstName ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Last name *</label>
          <input name="lastName" required defaultValue={defaults?.lastName ?? ""} className="input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Title</label>
          <input name="title" defaultValue={defaults?.title ?? ""} className="input" />
        </div>
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" defaultValue={defaults?.email ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" defaultValue={defaults?.phone ?? ""} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea name="notes" defaultValue={defaults?.notes ?? ""} className="input min-h-[60px]" />
      </div>
      <Actions label={submitLabel} onDone={onDone} />
    </form>
  );
}

export function VendorForm({
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Vendor name *</label>
          <input name="name" required defaultValue={defaults?.name ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category" defaultValue={defaults?.category ?? ""} className="input">
            <option value="">— select —</option>
            {VENDOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Contact name</label>
          <input name="contactName" defaultValue={defaults?.contactName ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Website</label>
          <input name="website" defaultValue={defaults?.website ?? ""} className="input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" defaultValue={defaults?.email ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" defaultValue={defaults?.phone ?? ""} className="input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Lead time (days)</label>
          <input name="leadTimeDays" type="number" defaultValue={defaults?.leadTimeDays ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Rating (1–5)</label>
          <input name="rating" type="number" min={1} max={5} defaultValue={defaults?.rating ?? ""} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea name="notes" defaultValue={defaults?.notes ?? ""} className="input min-h-[60px]" />
      </div>
      <Actions label={submitLabel} onDone={onDone} />
    </form>
  );
}
