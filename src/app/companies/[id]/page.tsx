import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, StageBadge } from "@/components/ui";
import { EditCompanyButton } from "@/components/EntityButtons";
import { formatCurrency } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function CompanyDetail({
  params,
}: {
  params: { id: string };
}) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      contacts: { orderBy: { lastName: "asc" } },
      projects: {
        orderBy: { updatedAt: "desc" },
        include: { stage: { select: { name: true, color: true } } },
      },
    },
  });
  if (!company) notFound();

  return (
    <div>
      <PageHeader
        title={company.name}
        subtitle={company.industry ?? undefined}
        action={
          <EditCompanyButton
            id={company.id}
            defaults={{
              name: company.name,
              industry: company.industry,
              website: company.website,
              phone: company.phone,
              address: company.address,
              city: company.city,
              state: company.state,
              notes: company.notes,
            }}
          />
        }
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Details</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Phone" value={company.phone} />
            <Row label="Website" value={company.website} />
            <Row
              label="Address"
              value={[company.address, company.city, company.state]
                .filter(Boolean)
                .join(", ")}
            />
          </dl>
          {company.notes && (
            <p className="mt-4 whitespace-pre-wrap border-t border-slate-100 pt-4 text-sm text-slate-600">
              {company.notes}
            </p>
          )}
        </div>

        <div className="card lg:col-span-1">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-700">Contacts</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {company.contacts.length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400">No contacts.</p>
            )}
            {company.contacts.map((c) => (
              <Link
                key={c.id}
                href={`/contacts`}
                className="block px-5 py-3 hover:bg-slate-50"
              >
                <div className="text-sm font-medium text-slate-800">
                  {c.firstName} {c.lastName}
                </div>
                <div className="text-xs text-slate-500">
                  {c.title ?? ""} {c.email ? `· ${c.email}` : ""}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card lg:col-span-1">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-700">Projects</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {company.projects.length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400">No projects.</p>
            )}
            {company.projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
              >
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    {p.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatCurrency(p.estRevenue)}
                  </div>
                </div>
                <StageBadge stage={p.stage} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-700">{value || "—"}</dd>
    </div>
  );
}
