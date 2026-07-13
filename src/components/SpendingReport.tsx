"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";
import { Modal } from "@/components/Modal";
import {
  EXPENSE_TYPES,
  MILEAGE_RATE,
  expenseTypeMeta,
  formatCurrency,
  formatDate,
} from "@/lib/constants";
import { addExpense, deleteExpense } from "@/lib/actions/expenses";

type ExpenseDTO = {
  id: string;
  type: string;
  amount: number;
  miles: number | null;
  notes: string | null;
  date: string;
  prospectId: string | null;
  prospectName: string | null;
};

type ProspectRef = { id: string; name: string };

const ALL = "__all__";
const UNASSIGNED = "__unassigned__";

function monthKey(iso: string) {
  return iso.slice(0, 7); // YYYY-MM
}
function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

export function SpendingReport({
  expenses,
  prospects,
}: {
  expenses: ExpenseDTO[];
  prospects: ProspectRef[];
}) {
  const [typeFilter, setTypeFilter] = useState<string>(ALL);
  const [prospectFilter, setProspectFilter] = useState<string>(ALL);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (typeFilter !== ALL && e.type !== typeFilter) return false;
      if (prospectFilter === UNASSIGNED && e.prospectId !== null) return false;
      if (
        prospectFilter !== ALL &&
        prospectFilter !== UNASSIGNED &&
        e.prospectId !== prospectFilter
      )
        return false;
      const d = e.date.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [expenses, typeFilter, prospectFilter, from, to]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const totalMiles = filtered.reduce((s, e) => s + (e.miles ?? 0), 0);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filtered) map.set(e.type, (map.get(e.type) ?? 0) + e.amount);
    return EXPENSE_TYPES.map((t) => ({
      ...t,
      amount: map.get(t.key) ?? 0,
    })).filter((t) => t.amount > 0);
  }, [filtered]);

  // Monthly totals for the trend chart (last 6 months present in data window).
  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filtered)
      map.set(monthKey(e.date), (map.get(monthKey(e.date)) ?? 0) + e.amount);
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([key, amount]) => ({ key, amount }));
  }, [filtered]);

  function exportCsv() {
    const rows = [
      ["Date", "Type", "Amount", "Miles", "Prospect", "Notes"],
      ...filtered.map((e) => [
        e.date.slice(0, 10),
        expenseTypeMeta(e.type).label,
        e.amount.toFixed(2),
        e.miles == null ? "" : String(e.miles),
        e.prospectName ?? "Unassigned",
        (e.notes ?? "").replace(/"/g, '""'),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Spending Report"
        subtitle="Territory expenses — gas, meals, gifts"
        action={
          <div className="flex items-center gap-2">
            <Link href="/territory" className="btn-ghost">
              ← Map
            </Link>
            <AddExpenseModal prospects={prospects} />
          </div>
        }
      />

      <div className="space-y-6 p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total spend" value={formatCurrency(total)} />
          <StatCard label="Expenses" value={String(filtered.length)} />
          <StatCard
            label="Miles logged"
            value={totalMiles.toLocaleString()}
            sub={`@ $${MILEAGE_RATE.toFixed(2)}/mi`}
          />
          <StatCard
            label="Avg / expense"
            value={formatCurrency(filtered.length ? total / filtered.length : 0)}
          />
        </div>

        {/* Filters */}
        <div className="card flex flex-wrap items-end gap-4 p-5">
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value={ALL}>All types</option>
              {EXPENSE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Prospect</label>
            <select
              className="input"
              value={prospectFilter}
              onChange={(e) => setProspectFilter(e.target.value)}
            >
              <option value={ALL}>All prospects</option>
              <option value={UNASSIGNED}>Unassigned</option>
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input
              type="date"
              className="input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              className="input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="ml-auto flex items-end gap-2">
            {(typeFilter !== ALL ||
              prospectFilter !== ALL ||
              from ||
              to) && (
              <button
                className="btn-ghost"
                onClick={() => {
                  setTypeFilter(ALL);
                  setProspectFilter(ALL);
                  setFrom("");
                  setTo("");
                }}
              >
                Clear
              </button>
            )}
            <button
              className="btn-ghost"
              onClick={exportCsv}
              disabled={filtered.length === 0}
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Trend chart */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">
              Monthly trend
            </h2>
            <TrendChart data={monthly} />
          </div>

          {/* By type breakdown */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">
              By category
            </h2>
            {byType.length === 0 ? (
              <p className="text-sm text-slate-400">No expenses in range.</p>
            ) : (
              <div className="space-y-3">
                {byType.map((t) => {
                  const pct = total > 0 ? (t.amount / total) * 100 : 0;
                  return (
                    <div key={t.key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: t.color }}
                          />
                          {t.label}
                        </span>
                        <span className="font-medium text-slate-700">
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: t.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Expense list */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-700">Expenses</h2>
          </div>
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No expenses"
                hint="Log an expense or adjust the filters above."
              />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="th">Date</th>
                  <th className="th">Type</th>
                  <th className="th">Prospect</th>
                  <th className="th">Notes</th>
                  <th className="th text-right">Miles</th>
                  <th className="th text-right">Amount</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const meta = expenseTypeMeta(e.type);
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                    >
                      <td className="td text-slate-500">
                        {formatDate(e.date)}
                      </td>
                      <td className="td">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: `${meta.color}1a`,
                            color: meta.color,
                          }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="td text-slate-500">
                        {e.prospectName ?? (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="td text-slate-500">{e.notes ?? "—"}</td>
                      <td className="td text-right text-slate-500">
                        {e.miles == null ? "—" : e.miles.toLocaleString()}
                      </td>
                      <td className="td text-right font-medium">
                        {formatCurrency(e.amount)}
                      </td>
                      <td className="td text-right">
                        <DeleteButton id={e.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: { key: string; amount: number }[] }) {
  if (data.length === 0)
    return <p className="text-sm text-slate-400">No expenses in range.</p>;

  const max = Math.max(...data.map((d) => d.amount), 1);
  const W = 520;
  const H = 180;
  const pad = 32;
  const barGap = 12;
  const barW = Math.min(
    64,
    (W - pad * 2 - barGap * (data.length - 1)) / data.length,
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Monthly spending trend"
    >
      {[0, 0.5, 1].map((f) => {
        const y = pad + (H - pad * 2) * (1 - f);
        return (
          <g key={f}>
            <line
              x1={pad}
              y1={y}
              x2={W - pad}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            <text x={4} y={y + 4} fontSize={9} fill="#94a3b8">
              {formatCurrency(max * f)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = ((H - pad * 2) * d.amount) / max;
        const x = pad + i * (barW + barGap);
        const y = H - pad - h;
        return (
          <g key={d.key}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={4}
              fill="#0ea5e9"
            />
            <text
              x={x + barW / 2}
              y={H - pad + 14}
              fontSize={9}
              fill="#64748b"
              textAnchor="middle"
            >
              {monthLabel(d.key)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-ghost text-slate-400 hover:text-red-600"
      disabled={pending}
      onClick={() => start(() => deleteExpense(id))}
      aria-label="Delete expense"
    >
      ✕
    </button>
  );
}

function AddExpenseModal({ prospects }: { prospects: ProspectRef[] }) {
  const [type, setType] = useState("gas");
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();

  return (
    <Modal
      title="Log expense"
      trigger={(open) => (
        <button className="btn-primary" onClick={open}>
          + Log expense
        </button>
      )}
    >
      {(close) => (
        <form
          ref={formRef}
          action={(fd) =>
            start(async () => {
              await addExpense(fd);
              close();
            })
          }
          className="space-y-4"
        >
          <div>
            <label className="label">Type</label>
            <select
              name="type"
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {EXPENSE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {type === "gas" && (
            <div>
              <label className="label">Miles</label>
              <input
                name="miles"
                type="number"
                step="any"
                className="input"
                placeholder="e.g. 42"
              />
              <p className="mt-1 text-xs text-slate-400">
                Leave amount blank to auto-calc from miles at $
                {MILEAGE_RATE.toFixed(2)}/mi.
              </p>
            </div>
          )}
          <div>
            <label className="label">Amount ($)</label>
            <input
              name="amount"
              type="number"
              step="any"
              className="input"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="label">Prospect (optional)</label>
            <select name="prospectId" className="input" defaultValue="">
              <option value="">Unassigned</option>
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              name="date"
              type="date"
              className="input"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <input name="notes" className="input" placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
