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
  const file = formData.get("photo");
  if (!prospectId || !packagingType || !(file instanceof File) || file.size === 0)
    return;

  const ext = path.extname(file.name).replace(/[^a-zA-Z0-9.]/g, "").slice(0, 20);
  const stored = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir(), stored), buffer);

  const notes = (formData.get("notes") ?? "").toString().trim();
  await prisma.inventoryItem.create({
    data: {
      prospectId,
      filename: stored,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      packagingType,
      notes: notes === "" ? null : notes,
    },
  });
  revalidatePath("/territory");
}

export async function deleteInventoryItem(id: string) {
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (item) {
    await fs.unlink(path.join(uploadDir(), item.filename)).catch(() => {});
    await prisma.inventoryItem.delete({ where: { id } });
  }
  revalidatePath("/territory");
}
