import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { uploadDir } from "@/lib/uploads";

export const dynamic = "force-dynamic";

// Types safe to render inline in the browser. Everything else is forced to
// download to avoid stored-XSS (e.g. HTML/SVG executing in our origin).
const INLINE = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const att = await prisma.attachment.findUnique({ where: { id: params.id } });
  if (!att) return new Response("Not found", { status: 404 });

  let data: Buffer;
  try {
    data = await fs.readFile(path.join(uploadDir(), att.filename));
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const disposition = INLINE.has(att.mimeType) ? "inline" : "attachment";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": att.mimeType,
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(
        att.originalName
      )}`,
      "Content-Length": String(att.size),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
