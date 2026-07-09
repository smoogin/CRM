"use server";

import { prisma } from "@/lib/prisma";
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
function date(v: FormDataEntryValue | null): Date | null {
  const s = str(v);
  return s ? new Date(s) : null;
}

export async function createProject(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;

  let stageId = str(formData.get("stageId"));
  if (!stageId) {
    const first = await prisma.stage.findFirst({ orderBy: { position: "asc" } });
    if (!first) return; // no stages configured
    stageId = first.id;
  }

  const last = await prisma.project.findFirst({
    where: { stageId },
    orderBy: { position: "desc" },
  });

  await prisma.project.create({
    data: {
      name,
      description: str(formData.get("description")),
      stageId,
      priority: str(formData.get("priority")) ?? "MEDIUM",
      position: (last?.position ?? -1) + 1,
      quantity: num(formData.get("quantity")) ?? undefined,
      targetDate: date(formData.get("targetDate")) ?? undefined,
      companyId: str(formData.get("companyId")) ?? undefined,
      contactId: str(formData.get("contactId")) ?? undefined,
      estRevenue: num(formData.get("estRevenue")) ?? undefined,
      estCost: num(formData.get("estCost")) ?? undefined,
    },
  });
  revalidatePath("/");
  revalidatePath("/projects");
}

export async function updateProject(id: string, formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.project.update({
    where: { id },
    data: {
      name,
      description: str(formData.get("description")),
      stageId: str(formData.get("stageId")) ?? undefined,
      priority: str(formData.get("priority")) ?? "MEDIUM",
      quantity: num(formData.get("quantity")),
      targetDate: date(formData.get("targetDate")),
      companyId: str(formData.get("companyId")),
      contactId: str(formData.get("contactId")),
      estRevenue: num(formData.get("estRevenue")),
      estCost: num(formData.get("estCost")),
    },
  });
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/projects");
}

// Called by the kanban board when a card is dragged.
export async function moveProject(
  id: string,
  toStageId: string,
  toPosition: number
) {
  const moving = await prisma.project.findUnique({ where: { id } });
  if (!moving) return;

  const targets = await prisma.project.findMany({
    where: { stageId: toStageId, id: { not: id } },
    orderBy: { position: "asc" },
  });

  const clamped = Math.max(0, Math.min(toPosition, targets.length));
  targets.splice(clamped, 0, moving as (typeof targets)[number]);

  await prisma.$transaction([
    prisma.project.update({
      where: { id },
      data: { stageId: toStageId },
    }),
    ...targets.map((p, idx) =>
      prisma.project.update({
        where: { id: p.id },
        data: { position: idx },
      })
    ),
  ]);

  revalidatePath("/");
  revalidatePath("/projects");
}

export async function addProjectVendor(
  projectId: string,
  formData: FormData
) {
  const vendorId = str(formData.get("vendorId"));
  if (!vendorId) return;
  await prisma.projectVendor.upsert({
    where: { projectId_vendorId: { projectId, vendorId } },
    create: {
      projectId,
      vendorId,
      role: str(formData.get("role")),
      quotedCost: num(formData.get("quotedCost")),
    },
    update: {
      role: str(formData.get("role")),
      quotedCost: num(formData.get("quotedCost")),
    },
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function removeProjectVendor(id: string, projectId: string) {
  await prisma.projectVendor.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}`);
}
