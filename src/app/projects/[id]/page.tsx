import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, StageBadge, PriorityDot } from "@/components/ui";
import { EditProjectButton } from "@/components/EditProjectButton";
import { DeleteButton } from "@/components/DeleteButton";
import { FINANCIAL_CATEGORIES, formatCurrency, formatDate } from "@/lib/constants";
import {
  deleteProject,
  addProjectVendor,
  removeProjectVendor,
} from "@/lib/actions/projects";
import {
  createFinancialEntry,
  deleteFinancialEntry,
} from "@/lib/actions/entities";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({
  params,
}: {
  params: { id: string };
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      contact: true,
      stage: true,
      financials: { orderBy: { date: "desc" } },
      vendors: { include: { vendor: true } },
    },
  });

  if (!project) notFound();

  const [companies, contacts, allVendors, stages] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.contact.findMany({ orderBy: { lastName: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.stage.findMany({ orderBy: { position: "asc" } }),
  ]);

  const revenue = project.financials
    .filter((f) => f.type === "REVENUE")
    .reduce((s, f) => s + f.amount, 0);
  const cost = project.financials
    .filter((f) => f.type === "COST")
    .reduce((s, f) => s + f.amount, 0);
  const actualMargin = revenue - cost;
  const estMargin = (project.estRevenue ?? 0) - (project.estCost ?? 0);

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={project.company?.name ?? "No company"}
        action={
          <div className="flex items-center gap-2">
            <EditProjectButton
              id={project.id}
              companies={companies.map((c) => ({ id: c.id, label: c.name }))}
              contacts={contacts.map((c) => ({
                id: c.id,
                label: `${c.firstName} ${c.lastName}`,
              }))}
              stages={stages.map((s) => ({ id: s.id, label: s.name }))}
              defaults={{
                name: project.name,
                description: project.description,
                stageId: project.stageId,
                priority: project.priority,
                quantity: project.quantity,
                targetDate: project.targetDate
                  ? project.targetDate.toISOString().slice(0, 10)
                  : null,
                companyId: project.companyId,
                contactId: project.contactId,
                estRevenue: project.estRevenue,
                estCost: project.estCost,
              }}
            />
            <DeleteButton
              action={async () => {
                "use server";
                await deleteProject(project.id);
              }}
              confirmText="Delete this project and all its financial entries?"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        {/* Left: overview */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-3">
              <StageBadge stage={project.stage} />
              <PriorityDot priority={project.priority} />
            </div>
            {project.description && (
              <p className="mb-4 whitespace-pre-wrap text-sm text-slate-600">
                {project.description}
              </p>
            )}
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="Quantity" value={project.quantity?.toLocaleString() ?? "—"} />
              <Field label="Target date" value={formatDate(project.targetDate)} />
              <Field
                label="Contact"
                value={
                  project.contact
                    ? `${project.contact.firstName} ${project.contact.lastName}`
                    : "—"
                }
              />
              <Field label="Est. revenue" value={formatCurrency(project.estRevenue)} />
              <Field label="Est. cost" value={formatCurrency(project.estCost)} />
              <Field
                label="Est. margin"
                value={formatCurrency(estMargin)}
              />
            </dl>
          </div>

          {/* Financials */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-700">
                Financial entries
              </h2>
              <div className="text-xs text-slate-500">
                Rev {formatCurrency(revenue)} · Cost {formatCurrency(cost)} ·{" "}
                <span
                  className={
                    actualMargin >= 0 ? "text-emerald-600" : "text-red-600"
                  }
                >
                  Margin {formatCurrency(actualMargin)}
                </span>
              </div>
            </div>

            {project.financials.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">
                No entries yet. Add revenue or costs below.
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="th">Label</th>
                    <th className="th">Category</th>
                    <th className="th">Type</th>
                    <th className="th text-right">Amount</th>
                    <th className="th"></th>
                  </tr>
                </thead>
                <tbody>
                  {project.financials.map((f) => (
                    <tr
                      key={f.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="td font-medium">{f.label}</td>
                      <td className="td text-slate-500">{f.category ?? "—"}</td>
                      <td className="td">
                        <span
                          className={`badge ${
                            f.type === "REVENUE"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {f.type === "REVENUE" ? "Revenue" : "Cost"}
                        </span>
                      </td>
                      <td className="td text-right">
                        {formatCurrency(f.amount)}
                      </td>
                      <td className="td text-right">
                        <DeleteButton
                          small
                          label="✕"
                          confirmText="Delete this entry?"
                          action={async () => {
                            "use server";
                            await deleteFinancialEntry(f.id, project.id);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <form
              action={createFinancialEntry}
              className="grid grid-cols-2 gap-3 border-t border-slate-200 p-5 sm:grid-cols-5"
            >
              <input type="hidden" name="projectId" value={project.id} />
              <input
                name="label"
                required
                placeholder="Label"
                className="input col-span-2 sm:col-span-1"
              />
              <select name="category" className="input">
                <option value="">Category…</option>
                {FINANCIAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select name="type" className="input" defaultValue="COST">
                <option value="REVENUE">Revenue</option>
                <option value="COST">Cost</option>
              </select>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                placeholder="Amount"
                className="input"
              />
              <button className="btn-primary">Add</button>
            </form>
          </div>
        </div>

        {/* Right: vendors */}
        <div className="space-y-6">
          <div className="card">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-700">
                Vendors on this project
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {project.vendors.length === 0 && (
                <p className="px-5 py-6 text-sm text-slate-400">
                  No vendors linked yet.
                </p>
              )}
              {project.vendors.map((pv) => (
                <div
                  key={pv.id}
                  className="flex items-start justify-between px-5 py-3"
                >
                  <div>
                    <Link
                      href={`/vendors/${pv.vendorId}`}
                      className="text-sm font-medium text-slate-800 hover:text-brand-600"
                    >
                      {pv.vendor.name}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {pv.role ?? pv.vendor.category ?? "—"}
                      {pv.quotedCost != null &&
                        ` · ${formatCurrency(pv.quotedCost)}`}
                    </div>
                  </div>
                  <DeleteButton
                    small
                    label="✕"
                    confirmText="Remove this vendor from the project?"
                    action={async () => {
                      "use server";
                      await removeProjectVendor(pv.id, project.id);
                    }}
                  />
                </div>
              ))}
            </div>

            {allVendors.length > 0 && (
              <form
                action={addProjectVendor.bind(null, project.id)}
                className="space-y-2 border-t border-slate-200 p-5"
              >
                <select name="vendorId" required className="input">
                  <option value="">Select vendor…</option>
                  {allVendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input name="role" placeholder="Role / supplies" className="input" />
                  <input
                    name="quotedCost"
                    type="number"
                    step="0.01"
                    placeholder="Quoted $"
                    className="input"
                  />
                </div>
                <button className="btn-primary w-full">Link vendor</button>
              </form>
            )}
          </div>

          {project.company && (
            <div className="card p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-700">
                Company
              </h2>
              <Link
                href={`/companies/${project.company.id}`}
                className="text-sm font-medium text-brand-600"
              >
                {project.company.name}
              </Link>
              <div className="mt-1 text-xs text-slate-500">
                {project.company.industry ?? ""}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-700">{value}</dd>
    </div>
  );
}
