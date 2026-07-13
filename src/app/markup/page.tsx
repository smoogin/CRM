import { prisma } from "@/lib/prisma";
import { MarkupCalculator } from "@/components/MarkupCalculator";

export const dynamic = "force-dynamic";

export default async function MarkupCalculatorPage() {
  const saved = await prisma.markupCalc.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <MarkupCalculator
      saved={saved.map((s) => ({
        id: s.id,
        label: s.label,
        quantity: s.quantity,
        unitCost: s.unitCost,
        unitSell: s.unitSell,
        markup: s.markup,
        totalCost: s.totalCost,
        totalSell: s.totalSell,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}
