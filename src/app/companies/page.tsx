import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { NewCompanyButton, EditCompanyButton } from "@/components/EntityButtons";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteCompany } from "@/lib/actions/entities";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { contacts: true, projects: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle={`${companies.length} companies`}
        action={<NewCompanyButton />}
      />
      <div className="p-8">
        {companies.length === 0 ? (
          <EmptyState title="No companies yet" hint="Add your first customer company." />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="th">Company</th>
                  <th className="th">Industry</th>
                  <th className="th">Location</th>
                  <th className="th">Phone</th>
                  <th className="th text-center">Contacts</th>
                  <th className="th text-center">Projects</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="td font-medium">
                      <Link href={`/companies/${c.id}`} className="hover:text-brand-600">
                        {c.name}
                      </Link>
                    </td>
                    <td className="td text-slate-500">{c.industry ?? "—"}</td>
                    <td className="td text-slate-500">
                      {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="td text-slate-500">{c.phone ?? "—"}</td>
                    <td className="td text-center">{c._count.contacts}</td>
                    <td className="td text-center">{c._count.projects}</td>
                    <td className="td text-right">
                      <div className="flex items-center justify-end gap-3">
                        <EditCompanyButton
                          id={c.id}
                          defaults={{
                            name: c.name,
                            industry: c.industry,
                            website: c.website,
                            phone: c.phone,
                            address: c.address,
                            city: c.city,
                            state: c.state,
                            notes: c.notes,
                          }}
                        />
                        <DeleteButton
                          small
                          label="Delete"
                          confirmText={`Delete ${c.name}?`}
                          action={async () => {
                            "use server";
                            await deleteCompany(c.id);
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
