import { prisma } from "@/lib/prisma";
import { SpendingReport } from "@/components/SpendingReport";

export const dynamic = "force-dynamic";

export default async function SpendingPage() {
  const [expenses, prospects] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      include: { prospect: { select: { name: true } } },
    }),
    prisma.prospect.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <SpendingReport
      expenses={expenses.map((e) => ({
        id: e.id,
        type: e.type,
        amount: e.amount,
        miles: e.miles,
        notes: e.notes,
        date: e.date.toISOString(),
        prospectId: e.prospectId,
        prospectName: e.prospect?.name ?? null,
      }))}
      prospects={prospects}
    />
  );
}
