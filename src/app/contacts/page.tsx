import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { NewContactButton, EditContactButton } from "@/components/EntityButtons";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteContact } from "@/lib/actions/entities";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const [contacts, companies] = await Promise.all([
    prisma.contact.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: { company: { select: { id: true, name: true } } },
    }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
  ]);

  const companyOpts = companies.map((c) => ({ id: c.id, label: c.name }));

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle={`${contacts.length} contacts`}
        action={<NewContactButton companies={companyOpts} />}
      />
      <div className="p-8">
        {contacts.length === 0 ? (
          <EmptyState title="No contacts yet" hint="Add the people you work with." />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="th">Name</th>
                  <th className="th">Title</th>
                  <th className="th">Company</th>
                  <th className="th">Email</th>
                  <th className="th">Phone</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="td font-medium">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="td text-slate-500">{c.title ?? "—"}</td>
                    <td className="td text-slate-500">
                      {c.company ? (
                        <Link
                          href={`/companies/${c.company.id}`}
                          className="hover:text-brand-600"
                        >
                          {c.company.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="td text-slate-500">
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="hover:text-brand-600">
                          {c.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="td text-slate-500">{c.phone ?? "—"}</td>
                    <td className="td text-right">
                      <div className="flex items-center justify-end gap-3">
                        <EditContactButton
                          id={c.id}
                          companies={companyOpts}
                          defaults={{
                            firstName: c.firstName,
                            lastName: c.lastName,
                            title: c.title,
                            email: c.email,
                            phone: c.phone,
                            notes: c.notes,
                            companyId: c.companyId,
                          }}
                        />
                        <DeleteButton
                          small
                          label="Delete"
                          confirmText={`Delete ${c.firstName} ${c.lastName}?`}
                          action={async () => {
                            "use server";
                            await deleteContact(c.id);
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
