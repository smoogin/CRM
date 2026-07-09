"use server";

import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { uploadDir } from "@/lib/uploads";
import { revalidatePath } from "next/cache";

export async function uploadAttachment(formData: FormData) {
  const projectId = (formData.get("projectId") ?? "").toString();
  const file = formData.get("file");
  if (!projectId || !(file instanceof File) || file.size === 0) return;

  const ext = path.extname(file.name).replace(/[^a-zA-Z0-9.]/g, "").slice(0, 20);
  const stored = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir(), stored), buffer);

  await prisma.attachment.create({
    data: {
      projectId,
      filename: stored,
      originalName: file.name.slice(0, 255),
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    },
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteAttachment(id: string, projectId: string) {
  const att = await prisma.attachment.findUnique({ where: { id } });
  if (att) {
    await fs.unlink(path.join(uploadDir(), att.filename)).catch(() => {});
    await prisma.attachment.delete({ where: { id } });
  }
  revalidatePath(`/projects/${projectId}`);
}
