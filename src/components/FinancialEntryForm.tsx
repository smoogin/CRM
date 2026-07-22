"use client";

import { useState, useTransition } from "react";
import { createFinancialEntry } from "@/lib/actions/entities";
import { FINANCIAL_CATEGORIES } from "@/lib/constants";

type Field =
  | "quantity"
  | "unitCost"
  | "unitSell"
  | "markup"
  | "totalCost"
  | "totalSell";

type Fields = Record<Field, string>;

const EMPTY: Fields = {
  quantity: "1",
  unitCost: "",
  unitSell: "",
  markup: "",
  totalCost: "",
  totalSell: "",
};

const num = (s: string) => {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : NaN;
};

function fmt(v: number, kind: "qty" | "unit" | "money" | "pct"): string {
  if (!Number.isFinite(v)) return "";
  if (kind === "qty") return String(Math.round(v));
  const dec = kind === "unit" ? 4 : 2;
  const s = v.toFixed(dec);
  return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
}

export function FinancialEntryForm({ projectId }: { projectId: string }) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");
  const [pending, start] = useTransition();

  // Bidirectional autofill — same logic as the Markup Calculator.
  function change(key: Field, v: string) {
    const cur = { ...fields, [key]: v };
    const q = num(cur.quantity);

    let uc: number;
    if (key === "unitCost") uc = num(v);
    else if (key === "totalCost") uc = num(v) / q;
    else uc = num(cur.unitCost);

    let m: number;
    if (key === "markup") m = num(v);
    else if (key === "unitSell") m = (num(v) / uc - 1) * 100;
    else if (key === "totalSell") m = (num(v) / q / uc - 1) * 100;
    else m = num(cur.markup);

    const us = uc * (1 + m / 100);
    const tc = uc * q;
    const ts = us * q;

    setFields({
      quantity: key === "quantity" ? v : fmt(q, "qty"),
      unitCost: key === "unitCost" ? v : fmt(uc, "unit"),
      unitSell: key === "unitSell" ? v : fmt(us, "unit"),
      markup: key === "markup" ? v : fmt(m, "pct"),
      totalCost: key === "totalCost" ? v : fmt(tc, "money"),
      totalSell: key === "totalSell" ? v : fmt(ts, "money"),
    });
  }

  const q = num(fields.quantity);
  const uc = num(fields.unitCost);
  const us = num(fields.unitSell);
  const mk = num(fields.markup);
  const tc = num(fields.totalCost);
  const ts = num(fields.totalSell);

  const canAdd =
    label.trim() !== "" &&
    Number.isFinite(q) &&
    Number.isFinite(uc) &&
    Number.isFinite(us) &&
    Number.isFinite(mk) &&
    Number.isFinite(tc) &&
    Number.isFinite(ts);

  function submit() {
    if (!canAdd) return;
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("label", label.trim());
    fd.set("category", category);
    fd.set("quantity", String(Math.round(q)));
    fd.set("unitCost", String(uc));
    fd.set("markup", String(mk));
    fd.set("unitSell", String(us));
    fd.set("totalCost", String(tc));
    fd.set("totalSell", String(ts));
    start(async () => {
      await createFinancialEntry(fd);
      setFields(EMPTY);
      setLabel("");
      setCategory("");
    });
  }

  return (
    <div className="space-y-3 border-t border-slate-200 p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          className="input col-span-2 sm:col-span-2"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input col-span-2 sm:col-span-2"
        >
          <option value="">Category…</option>
          {FINANCIAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <Field
          label="Quantity"
          value={fields.quantity}
          onChange={(v) => change("quantity", v)}
        />
        <Field
          label="Unit cost"
          value={fields.unitCost}
          onChange={(v) => change("unitCost", v)}
          prefix="$"
        />
        <Field
          label="Markup"
          value={fields.markup}
          onChange={(v) => change("markup", v)}
          suffix="%"
        />
        <Field
          label="Unit sell"
          value={fields.unitSell}
          onChange={(v) => change("unitSell", v)}
          prefix="$"
        />
        <Field
          label="Total cost"
          value={fields.totalCost}
          onChange={(v) => change("totalCost", v)}
          prefix="$"
        />
        <Field
          label="Total sell"
          value={fields.totalSell}
          onChange={(v) => change("totalSell", v)}
          prefix="$"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="btn-primary"
          onClick={submit}
          disabled={!canAdd || pending}
        >
          {pending ? "Adding…" : "Add entry"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {prefix}
          </span>
        )}
        <input
          className={`input ${prefix ? "pl-7" : ""} ${suffix ? "pr-8" : ""}`}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
