"use client";

import { useState, useTransition } from "react";
import { updateProjectNotes } from "@/lib/actions/entities";

export function ProjectNotes({
  projectId,
  initial,
}: {
  projectId: string;
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState(false);
  const dirty = value !== initial;

  function save() {
    const fd = new FormData();
    fd.set("notes", value);
    start(async () => {
      await updateProjectNotes(projectId, fd);
      setSavedAt(true);
      setTimeout(() => setSavedAt(false), 2000);
    });
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-700">Notes</h2>
        <div className="flex items-center gap-3">
          {savedAt && !dirty && (
            <span className="text-xs text-emerald-600">Saved</span>
          )}
          <button
            className="btn-primary"
            onClick={save}
            disabled={pending || !dirty}
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <div className="p-5">
        <textarea
          className="input min-h-[120px] resize-y"
          placeholder="Add notes about this project…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </div>
  );
}
