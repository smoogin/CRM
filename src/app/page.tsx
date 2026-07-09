import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, StageBadge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [stages, projects, companyCount, contactCount, vendorCount] =
    await Promise.all([
      prisma.stage.findMany({ orderBy: { position: "asc" } }),
      prisma.project.findMany({
        include: {
          company: { select: { name: true } },
          stage: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.company.count(),
      prisma.contact.count(),
      prisma.vendor.count(),
    ]);

  const inCategory = (cat: string) =>
    projects.filter((p) => p.stage.category === cat);

  const pipelineValue = inCategory("OPEN").reduce(
    (s, p) => s + (p.estRevenue ?? 0),
    0
  );

  const wonRevenue = inCategory("WON").reduce(
    (s, p) => s + (p.estRevenue ?? 0),
    0
  );

  const wonMargin = inCategory("WON").reduce(
    (s, p) => s + ((p.estRevenue ?? 0) - (p.estCost ?? 0)),
    0
  );

  const activeCount = projects.filter(
    (p) => p.stage.category !== "LOST"
  ).length;

  const countByStage = (id: string) =>
    projects.filter((p) => p.stageId === id).length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your packaging sales pipeline at a glance"
      />
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Open pipeline"
            value={formatCurrency(pipelineValue)}
            sub="Open-category stages"
            href="/projects"
          />
          <StatCard
            label="Won revenue"
            value={formatCurrency(wonRevenue)}
            sub={`Est. margin ${formatCurrency(wonMargin)}`}
            href="/projects"
          />
          <StatCard
            label="Active projects"
            value={String(activeCount)}
            sub={`${projects.length} total`}
            href="/projects"
          />
          <StatCard
            label="Network"
            value={`${companyCount} / ${contactCount}`}
            sub={`companies / contacts · ${vendorCount} vendors`}
            href="/companies"
          />
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            Pipeline by stage
          </h2>
          <div className="flex flex-wrap gap-3">
            {stages.map((s) => (
              <Link
                key={s.id}
                href="/projects"
                className="flex min-w-[120px] flex-1 flex-col rounded-lg border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
              >
                <span className="text-xs text-slate-500">{s.name}</span>
                <span
                  className="mt-1 text-2xl font-bold"
                  style={{ color: s.color }}
                >
                  {countByStage(s.id)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-700">
              Recent projects
            </h2>
            <Link href="/projects" className="text-xs text-brand-600">
              View board →
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No projects yet. Head to the Projects board to add one.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="th">Project</th>
                  <th className="th">Company</th>
                  <th className="th">Stage</th>
                  <th className="th">Est. revenue</th>
                  <th className="th">Target</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 8).map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="td font-medium">
                      <Link href={`/projects/${p.id}`}>{p.name}</Link>
                    </td>
                    <td className="td text-slate-500">
                      {p.company?.name ?? "—"}
                    </td>
                    <td className="td">
                      <StageBadge stage={p.stage} />
                    </td>
                    <td className="td">{formatCurrency(p.estRevenue)}</td>
                    <td className="td text-slate-500">
                      {formatDate(p.targetDate)}
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
