import fs from "fs";
import path from "path";

// Store uploads on the same disk as the SQLite database so they live on the
// Railway persistent volume automatically (DATABASE_URL=file:/data/dev.db ->
// /data/uploads). Locally (file:./dev.db) they land in ./uploads.
export function uploadDir(): string {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const dbPath = url.replace(/^file:/, "");
  const baseDir = path.isAbsolute(dbPath) ? path.dirname(dbPath) : process.cwd();
  const dir = path.join(baseDir, "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
