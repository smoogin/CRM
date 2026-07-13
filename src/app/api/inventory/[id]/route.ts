import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { uploadDir } from "@/lib/uploads";

export const dynamic = "force-dynamic";

// Only image types render inline; anything else is forced to download to avoid
// stored-XSS (e.g. an SVG/HTML executing in our origin).
const INLINE = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: params.id },
  });
  if (!item || !item.filename) return new Response("Not found", { status: 404 });

  let data: Buffer;
  try {
    data = await fs.readFile(path.join(uploadDir(), item.filename));
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const mimeType = item.mimeType ?? "application/octet-stream";
  const disposition = INLINE.has(mimeType) ? "inline" : "attachment";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(
        item.filename,
      )}`,
      "Content-Length": String(data.byteLength),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
