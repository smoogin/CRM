import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, StageBadge } from "@/components/ui";
import { EditVendorButton } from "@/components/EntityButtons";
import { formatCurrency } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function VendorDetail({
  params,
}: {
  params: { id: string };
}) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: {
      projects: {
        include: {
          project: {
            include: { stage: { select: { name: true, color: true } } },
          },
        },
      },
    },
  });
  if (!vendor) notFound();

  return (
    <div>
      <PageHeader
        title={vendor.name}
        subtitle={vendor.category ?? undefined}
        action={
          <EditVendorButton
            id={vendor.id}
            defaults={{
              name: vendor.name,
              category: vendor.category,
              contactName: vendor.contactName,
              email: vendor.email,
              phone: vendor.phone,
              website: vendor.website,
              leadTimeDays:
                vendor.leadTimeDays != null ? String(vendor.leadTimeDays) : "",
              rating: vendor.rating != null ? String(vendor.rating) : "",
              notes: vendor.notes,
            }}
          />
        }
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Details</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Contact" value={vendor.contactName} />
            <Row label="Email" value={vendor.email} />
            <Row label="Phone" value={vendor.phone} />
            <Row label="Website" value={vendor.website} />
            <Row
              label="Lead time"
              value={vendor.leadTimeDays ? `${vendor.leadTimeDays} days` : null}
            />
            <Row
              label="Rating"
              value={vendor.rating ? `${vendor.rating} / 5` : null}
            />
          </dl>
          {vendor.notes && (
            <p className="mt-4 whitespace-pre-wrap border-t border-slate-100 pt-4 text-sm text-slate-600">
              {vendor.notes}
            </p>
          )}
        </div>

        <div className="card lg:col-span-2">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-700">
              Projects using this vendor
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {vendor.projects.length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400">
                Not linked to any projects yet.
              </p>
            )}
            {vendor.projects.map((pv) => (
              <Link
                key={pv.id}
                href={`/projects/${pv.projectId}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
              >
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    {pv.project.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {pv.role ?? "—"}
                    {pv.quotedCost != null &&
                      ` · ${formatCurrency(pv.quotedCost)}`}
                  </div>
                </div>
                <StageBadge stage={pv.project.stage} />
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
