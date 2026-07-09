import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { NewVendorButton, EditVendorButton } from "@/components/EntityButtons";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteVendor } from "@/lib/actions/entities";

export const dynamic = "force-dynamic";

function Stars({ n }: { n: number | null }) {
  if (!n) return <span className="text-slate-300">—</span>;
  return (
    <span className="text-amber-400">
      {"★".repeat(n)}
      <span className="text-slate-200">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Vendors"
        subtitle={`${vendors.length} suppliers`}
        action={<NewVendorButton />}
      />
      <div className="p-8">
        {vendors.length === 0 ? (
          <EmptyState title="No vendors yet" hint="Add your packaging suppliers." />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="th">Vendor</th>
                  <th className="th">Category</th>
                  <th className="th">Contact</th>
                  <th className="th">Phone</th>
                  <th className="th text-center">Lead time</th>
                  <th className="th">Rating</th>
                  <th className="th text-center">Projects</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="td font-medium">{v.name}</td>
                    <td className="td text-slate-500">{v.category ?? "—"}</td>
                    <td className="td text-slate-500">
                      {v.contactName ?? "—"}
                      {v.email && (
                        <div className="text-xs text-slate-400">{v.email}</div>
                      )}
                    </td>
                    <td className="td text-slate-500">{v.phone ?? "—"}</td>
                    <td className="td text-center text-slate-500">
                      {v.leadTimeDays ? `${v.leadTimeDays}d` : "—"}
                    </td>
                    <td className="td">
                      <Stars n={v.rating} />
                    </td>
                    <td className="td text-center">{v._count.projects}</td>
                    <td className="td text-right">
                      <div className="flex items-center justify-end gap-3">
                        <EditVendorButton
                          id={v.id}
                          defaults={{
                            name: v.name,
                            category: v.category,
                            contactName: v.contactName,
                            email: v.email,
                            phone: v.phone,
                            website: v.website,
                            leadTimeDays:
                              v.leadTimeDays != null
                                ? String(v.leadTimeDays)
                                : "",
                            rating: v.rating != null ? String(v.rating) : "",
                            notes: v.notes,
                          }}
                        />
                        <DeleteButton
                          small
                          label="Delete"
                          confirmText={`Delete ${v.name}?`}
                          action={async () => {
                            "use server";
                            await deleteVendor(v.id);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
