import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, StageBadge } from "@/components/ui";
import { entryCost, entryRevenue, formatCurrency } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function FinancialsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      company: { select: { name: true } },
      stage: { select: { name: true, color: true } },
      financials: true,
    },
  });

  const rows = projects.map((p) => {
    const actualRevenue = p.financials.reduce(
      (s, f) => s + entryRevenue(f),
      0
    );
    const actualCost = p.financials.reduce((s, f) => s + entryCost(f), 0);
    return {
      id: p.id,
      name: p.name,
      company: p.company?.name ?? "—",
      stage: p.stage,
      estRevenue: p.estRevenue ?? 0,
      estCost: p.estCost ?? 0,
      actualRevenue,
      actualCost,
      actualMargin: actualRevenue - actualCost,
    };
  });

  const totalEstRevenue = rows.reduce((s, r) => s + r.estRevenue, 0);
  const totalActualRevenue = rows.reduce((s, r) => s + r.actualRevenue, 0);
  const totalActualCost = rows.reduce((s, r) => s + r.actualCost, 0);
  const totalMargin = totalActualRevenue - totalActualCost;
  const marginPct =
    totalActualRevenue > 0
      ? `${Math.round((totalMargin / totalActualRevenue) * 100)}% margin`
      : "—";

  return (
    <div>
      <PageHeader
        title="Financials"
        subtitle="Revenue, cost and margin across all projects"
      />
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Est. revenue" value={formatCurrency(totalEstRevenue)} />
          <StatCard label="Actual revenue" value={formatCurrency(totalActualRevenue)} />
          <StatCard label="Actual cost" value={formatCurrency(totalActualCost)} />
          <StatCard
            label="Actual margin"
            value={formatCurrency(totalMargin)}
            sub={marginPct}
          />
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-700">
              Per-project breakdown
            </h2>
          </div>
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              No projects yet.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="th">Project</th>
                  <th className="th">Company</th>
                  <th className="th">Stage</th>
                  <th className="th text-right">Est. rev</th>
                  <th className="th text-right">Act. rev</th>
                  <th className="th text-right">Act. cost</th>
                  <th className="th text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="td font-medium">
                      <Link href={`/projects/${r.id}`} className="hover:text-brand-600">
                        {r.name}
                      </Link>
                    </td>
                    <td className="td text-slate-500">{r.company}</td>
                    <td className="td">
                      <StageBadge stage={r.stage} />
                    </td>
                    <td className="td text-right text-slate-500">
                      {formatCurrency(r.estRevenue)}
                    </td>
                    <td className="td text-right">
                      {formatCurrency(r.actualRevenue)}
                    </td>
                    <td className="td text-right">
                      {formatCurrency(r.actualCost)}
                    </td>
                    <td
                      className={`td text-right font-medium ${
                        r.actualMargin >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(r.actualMargin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
