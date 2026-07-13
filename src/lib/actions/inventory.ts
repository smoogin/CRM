"use server";

import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { uploadDir } from "@/lib/uploads";
import { revalidatePath } from "next/cache";

export async function addInventoryItem(formData: FormData) {
  const prospectId = (formData.get("prospectId") ?? "").toString();
  const packagingType = (formData.get("packagingType") ?? "").toString().trim();
  if (!prospectId || !packagingType) return;

  // Photo is optional — an item can be logged with just a description/notes.
  const file = formData.get("photo");
  const hasFile = file instanceof File && file.size > 0;

  let stored: string | null = null;
  let mimeType: string | null = null;
  let size: number | null = null;
  if (hasFile) {
    const ext = path.extname(file.name).replace(/[^a-zA-Z0-9.]/g, "").slice(0, 20);
    stored = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadDir(), stored), buffer);
    mimeType = file.type || "application/octet-stream";
    size = file.size;
  }

  const notes = (formData.get("notes") ?? "").toString().trim();
  await prisma.inventoryItem.create({
    data: {
      prospectId,
      filename: stored,
      mimeType,
      size,
      packagingType,
      notes: notes === "" ? null : notes,
    },
  });
  revalidatePath("/territory");
}

export async function deleteInventoryItem(id: string) {
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (item) {
    if (item.filename)
      await fs.unlink(path.join(uploadDir(), item.filename)).catch(() => {});
    await prisma.inventoryItem.delete({ where: { id } });
  }
  revalidatePath("/territory");
}
