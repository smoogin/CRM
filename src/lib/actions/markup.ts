"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type MarkupCalcInput = {
  label: string | null;
  quantity: number;
  unitCost: number;
  unitSell: number;
  markup: number;
  totalCost: number;
  totalSell: number;
};

export async function saveMarkupCalc(input: MarkupCalcInput) {
  const nums = [
    input.quantity,
    input.unitCost,
    input.unitSell,
    input.markup,
    input.totalCost,
    input.totalSell,
  ];
  if (nums.some((n) => !Number.isFinite(n))) return;
  const label = (input.label ?? "").trim();
  await prisma.markupCalc.create({
    data: {
      label: label === "" ? null : label.slice(0, 120),
      quantity: Math.round(input.quantity),
      unitCost: input.unitCost,
      unitSell: input.unitSell,
      markup: input.markup,
      totalCost: input.totalCost,
      totalSell: input.totalSell,
    },
  });
  revalidatePath("/markup");
}

export async function deleteMarkupCalc(id: string) {
  await prisma.markupCalc.delete({ where: { id } });
  revalidatePath("/markup");
}
