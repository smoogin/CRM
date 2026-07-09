"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}

function revalidate() {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/financials");
}

export async function createStage(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;
  const last = await prisma.stage.findFirst({ orderBy: { position: "desc" } });
  await prisma.stage.create({
    data: {
      name,
      color: str(formData.get("color")) ?? "#64748b",
      category: str(formData.get("category")) ?? "OPEN",
      position: (last?.position ?? -1) + 1,
    },
  });
  revalidate();
}

export async function updateStage(id: string, formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.stage.update({
    where: { id },
    data: {
      name,
      color: str(formData.get("color")) ?? "#64748b",
      category: str(formData.get("category")) ?? "OPEN",
    },
  });
  revalidate();
}

// Deletes a stage. Any projects in it are moved to the target stage (or the
// nearest remaining stage). Deleting the last remaining stage is blocked.
export async function deleteStage(id: string, moveToId?: string) {
  const stages = await prisma.stage.findMany({ orderBy: { position: "asc" } });
  if (stages.length <= 1) return; // must keep at least one stage

  const remaining = stages.filter((s) => s.id !== id);
  const fallback = remaining.find((s) => s.id === moveToId) ?? remaining[0];

  const orphaned = await prisma.project.findMany({
    where: { stageId: id },
    orderBy: { position: "asc" },
  });

  await prisma.$transaction(async (tx) => {
    if (orphaned.length > 0) {
      const existing = await tx.project.count({
        where: { stageId: fallback.id },
      });
      await Promise.all(
        orphaned.map((p, i) =>
          tx.project.update({
            where: { id: p.id },
            data: { stageId: fallback.id, position: existing + i },
          })
        )
      );
    }
    await tx.stage.delete({ where: { id } });
  });

  revalidate();
}

// Reorders the columns. `orderedIds` is the full list of stage ids left→right.
export async function reorderStages(orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.stage.update({ where: { id }, data: { position: index } })
    )
  );
  revalidate();
}
