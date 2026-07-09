"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui";

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

const QTY_PRESETS = [1, 100, 1000, 5000, 10000];

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

export default function MarkupCalculatorPage() {
  const [fields, setFields] = useState<Fields>(EMPTY);

  function change(key: Field, v: string) {
    const cur = { ...fields, [key]: v };
    const q = num(cur.quantity);

    // unit cost from the most relevant input
    let uc: number;
    if (key === "unitCost") uc = num(v);
    else if (key === "totalCost") uc = num(v) / q;
    else uc = num(cur.unitCost);

    // markup (keeps unit cost fixed) from the most relevant input
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

  const tc = num(fields.totalCost);
  const ts = num(fields.totalSell);
  const profit = ts - tc;
  const margin = (profit / ts) * 100;

  return (
    <div>
      <PageHeader
        title="Markup Calculator"
        subtitle="Enter any two values and the rest fill in automatically."
        action={
          <button className="btn-ghost" onClick={() => setFields(EMPTY)}>
            Reset
          </button>
        }
      />

      <div className="p-4 sm:p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="card p-5 sm:p-6">
            <div>
              <label className="label" htmlFor="quantity">
                Quantity
              </label>
              <input
                id="quantity"
                className="input"
                inputMode="numeric"
                placeholder="e.g. 5000"
                value={fields.quantity}
                onChange={(e) => change("quantity", e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QTY_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => change("quantity", String(p))}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      num(fields.quantity) === p
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {p === 1 ? "1 unit" : p.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Money
                id="unitCost"
                label="Unit cost"
                value={fields.unitCost}
                onChange={(v) => change("unitCost", v)}
              />
              <Money
                id="unitSell"
                label="Unit sell"
                value={fields.unitSell}
                onChange={(v) => change("unitSell", v)}
              />

              <div className="sm:col-span-2">
                <label className="label" htmlFor="markup">
                  Markup %
                </label>
                <div className="relative">
                  <input
                    id="markup"
                    className="input pr-8"
                    inputMode="decimal"
                    placeholder="e.g. 35"
                    value={fields.markup}
                    onChange={(e) => change("markup", e.target.value)}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    %
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Markup = (Sell − Cost) ÷ Cost
                </p>
              </div>

              <Money
                id="totalCost"
                label="Total cost"
                value={fields.totalCost}
                onChange={(v) => change("totalCost", v)}
              />
              <Money
                id="totalSell"
                label="Total sell"
                value={fields.totalSell}
                onChange={(v) => change("totalSell", v)}
              />
            </div>
          </div>

          <div className="card grid grid-cols-2 divide-x divide-slate-100 p-0">
            <div className="p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Total profit
              </div>
              <div
                className={`mt-1 text-2xl font-bold ${
                  Number.isFinite(profit) && profit < 0
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {Number.isFinite(profit)
                  ? `$${fmt(profit, "money")}`
                  : "—"}
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Margin
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-800">
                {Number.isFinite(margin) ? `${fmt(margin, "pct")}%` : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Money({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          $
        </span>
        <input
          id={id}
          className="input pl-7"
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
