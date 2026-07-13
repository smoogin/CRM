"use server";

import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/geocode";
import { visitTypeMeta } from "@/lib/constants";
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

/* ---------------- Prospects ---------------- */

export async function createProspect(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;

  const address = str(formData.get("address"));
  let lat = num(formData.get("lat"));
  let lng = num(formData.get("lng"));
  let county = str(formData.get("county"));

  // Geocode when we have an address but no explicit coordinates.
  if (address && (lat === null || lng === null)) {
    const geo = await geocodeAddress(address);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      county = county ?? geo.county;
    }
  }

  await prisma.prospect.create({
    data: {
      name,
      address,
      lat,
      lng,
      county,
      status: str(formData.get("status")) ?? "cold",
      vertical: str(formData.get("vertical")),
      dealValueEstimate: num(formData.get("dealValueEstimate")),
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/territory");
}

export async function updateProspect(id: string, formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;

  const existing = await prisma.prospect.findUnique({ where: { id } });
  if (!existing) return;

  const address = str(formData.get("address"));
  let lat = num(formData.get("lat"));
  let lng = num(formData.get("lng"));
  let county = str(formData.get("county"));

  // Re-geocode only when the address changed and no explicit coords were given.
  if (
    address &&
    address !== existing.address &&
    (lat === null || lng === null)
  ) {
    const geo = await geocodeAddress(address);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      county = county ?? geo.county;
    }
  } else if (address === existing.address) {
    lat = lat ?? existing.lat;
    lng = lng ?? existing.lng;
    county = county ?? existing.county;
  }

  await prisma.prospect.update({
    where: { id },
    data: {
      name,
      address,
      lat,
      lng,
      county,
      status: str(formData.get("status")) ?? "cold",
      vertical: str(formData.get("vertical")),
      dealValueEstimate: num(formData.get("dealValueEstimate")),
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/territory");
}

export async function deleteProspect(id: string) {
  await prisma.prospect.delete({ where: { id } });
  revalidatePath("/territory");
}

/* ---------------- Visit log ---------------- */

export async function addVisitLog(prospectId: string, formData: FormData) {
  const type = str(formData.get("type"));
  if (!prospectId || !type) return;

  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
  });
  if (!prospect) return;

  // XP: base by visit type, doubled for reaching a cold/dormant account.
  const base = visitTypeMeta(type).xp;
  const multiplier =
    prospect.status === "cold" || prospect.status === "dormant" ? 2 : 1;

  const dateStr = str(formData.get("date"));
  const date = dateStr ? new Date(dateStr) : new Date();

  await prisma.visitLog.create({
    data: {
      prospectId,
      type,
      notes: str(formData.get("notes")),
      xpAwarded: base * multiplier,
      date,
    },
  });

  // Logging contact refreshes the health score / last-contact date.
  await prisma.prospect.update({
    where: { id: prospectId },
    data: { lastContactDate: date },
  });

  revalidatePath("/territory");
}

export async function deleteVisitLog(id: string) {
  const visit = await prisma.visitLog.findUnique({ where: { id } });
  if (!visit) return;
  await prisma.visitLog.delete({ where: { id } });

  // Roll last-contact back to the most recent remaining visit (if any).
  const latest = await prisma.visitLog.findFirst({
    where: { prospectId: visit.prospectId },
    orderBy: { date: "desc" },
  });
  await prisma.prospect.update({
    where: { id: visit.prospectId },
    data: { lastContactDate: latest?.date ?? null },
  });

  revalidatePath("/territory");
}
