"use server";

import { prisma } from "@/lib/prisma";
import { MILEAGE_RATE } from "@/lib/constants";
import { revalidatePath } from "next/cache";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}
function num(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function addExpense(formData: FormData) {
  const type = str(formData.get("type"));
  if (!type) return;

  const miles = num(formData.get("miles"));
  let amount = num(formData.get("amount"));
  // Auto-calc gas cost from mileage when an amount wasn't entered directly.
  if (amount === null && type === "gas" && miles !== null) {
    amount = Math.round(miles * MILEAGE_RATE * 100) / 100;
  }
  if (amount === null) return;

  const dateStr = str(formData.get("date"));
  await prisma.expense.create({
    data: {
      type,
      amount,
      miles,
      prospectId: str(formData.get("prospectId")) ?? undefined,
      notes: str(formData.get("notes")),
      date: dateStr ? new Date(dateStr) : new Date(),
    },
  });
  revalidatePath("/territory");
  revalidatePath("/territory/spending");
}

export async function deleteExpense(id: string) {
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/territory");
  revalidatePath("/territory/spending");
}
