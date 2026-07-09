"use client";

import { useRef, useState, useTransition } from "react";
import { uploadAttachment, deleteAttachment } from "@/lib/actions/attachments";

export type ProjectFile = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  const label = mimeType.includes("pdf")
    ? "PDF"
    : mimeType.startsWith("image/")
    ? "IMG"
    : "FILE";
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
      {label}
    </span>
  );
}

export function ProjectFiles({
  projectId,
  files,
}: {
  projectId: string;
  files: ProjectFile[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > 25 * 1024 * 1024) {
      setError("File is too large (25 MB max).");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("file", file);
    start(async () => {
      await uploadAttachment(fd);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-700">Files</h2>
        <label className="btn-primary cursor-pointer">
          {pending ? "Uploading…" : "Upload file"}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={onFileChange}
            disabled={pending}
          />
        </label>
      </div>

      {error && (
        <p className="border-b border-slate-100 px-5 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="divide-y divide-slate-100">
        {files.length === 0 && !pending && (
          <p className="px-5 py-6 text-sm text-slate-400">
            No files yet. Upload PDFs, images, or other documents.
          </p>
        )}
        {files.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between gap-3 px-5 py-3"
          >
            <a
              href={`/api/attachments/${f.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 flex-1 items-center gap-3 hover:text-brand-600"
            >
              <FileIcon mimeType={f.mimeType} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-800">
                  {f.originalName}
                </span>
                <span className="text-xs text-slate-400">
                  {formatBytes(f.size)} ·{" "}
                  {new Date(f.createdAt).toLocaleDateString()}
                </span>
              </span>
            </a>
            <button
              className="text-xs text-red-500 hover:underline"
              disabled={pending}
              onClick={() => {
                if (confirm(`Delete "${f.originalName}"?`)) {
                  start(async () => {
                    await deleteAttachment(f.id, projectId);
                  });
                }
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
