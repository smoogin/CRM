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

/* ---------------- Companies ---------------- */

export async function createCompany(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.company.create({
    data: {
      name,
      industry: str(formData.get("industry")),
      website: str(formData.get("website")),
      phone: str(formData.get("phone")),
      address: str(formData.get("address")),
      city: str(formData.get("city")),
      state: str(formData.get("state")),
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/companies");
}

export async function updateCompany(id: string, formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.company.update({
    where: { id },
    data: {
      name,
      industry: str(formData.get("industry")),
      website: str(formData.get("website")),
      phone: str(formData.get("phone")),
      address: str(formData.get("address")),
      city: str(formData.get("city")),
      state: str(formData.get("state")),
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
}

export async function deleteCompany(id: string) {
  await prisma.company.delete({ where: { id } });
  revalidatePath("/companies");
}

/* ---------------- Contacts ---------------- */

export async function createContact(formData: FormData) {
  const firstName = str(formData.get("firstName"));
  const lastName = str(formData.get("lastName"));
  if (!firstName || !lastName) return;
  await prisma.contact.create({
    data: {
      firstName,
      lastName,
      title: str(formData.get("title")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      notes: str(formData.get("notes")),
      companyId: str(formData.get("companyId")) ?? undefined,
    },
  });
  revalidatePath("/contacts");
}

export async function updateContact(id: string, formData: FormData) {
  const firstName = str(formData.get("firstName"));
  const lastName = str(formData.get("lastName"));
  if (!firstName || !lastName) return;
  await prisma.contact.update({
    where: { id },
    data: {
      firstName,
      lastName,
      title: str(formData.get("title")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      notes: str(formData.get("notes")),
      companyId: str(formData.get("companyId")),
    },
  });
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
}

export async function deleteContact(id: string) {
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
}

/* ---------------- Vendors ---------------- */

export async function createVendor(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.vendor.create({
    data: {
      name,
      category: str(formData.get("category")),
      contactName: str(formData.get("contactName")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      website: str(formData.get("website")),
      leadTimeDays: num(formData.get("leadTimeDays")) ?? undefined,
      rating: num(formData.get("rating")) ?? undefined,
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/vendors");
}

export async function updateVendor(id: string, formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.vendor.update({
    where: { id },
    data: {
      name,
      category: str(formData.get("category")),
      contactName: str(formData.get("contactName")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      website: str(formData.get("website")),
      leadTimeDays: num(formData.get("leadTimeDays")),
      rating: num(formData.get("rating")),
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
}

export async function deleteVendor(id: string) {
  await prisma.vendor.delete({ where: { id } });
  revalidatePath("/vendors");
}

/* ---------------- Financial entries ---------------- */

export async function createFinancialEntry(formData: FormData) {
  const projectId = str(formData.get("projectId"));
  const label = str(formData.get("label"));
  const quantity = num(formData.get("quantity"));
  const unitCost = num(formData.get("unitCost"));
  const markup = num(formData.get("markup"));
  const unitSell = num(formData.get("unitSell"));
  const totalCost = num(formData.get("totalCost"));
  const totalSell = num(formData.get("totalSell"));
  if (!projectId || !label) return;
  await prisma.financialEntry.create({
    data: {
      projectId,
      label,
      category: str(formData.get("category")),
      quantity: quantity !== null ? Math.round(quantity) : null,
      unitCost,
      markup,
      unitSell,
      totalCost,
      totalSell,
    },
  });
  revalidatePath("/financials");
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteFinancialEntry(id: string, projectId: string) {
  await prisma.financialEntry.delete({ where: { id } });
  revalidatePath("/financials");
  revalidatePath(`/projects/${projectId}`);
}

/* ---------------- Project notes ---------------- */

export async function updateProjectNotes(projectId: string, formData: FormData) {
  await prisma.project.update({
    where: { id: projectId },
    data: { notes: str(formData.get("notes")) },
  });
  revalidatePath(`/projects/${projectId}`);
}
