"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate, priorityMeta } from "@/lib/constants";
import { moveProject } from "@/lib/actions/projects";
import {
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
} from "@/lib/actions/stages";
import { Modal } from "@/components/Modal";
import { StageForm } from "@/components/StageForm";

export type KanbanStage = {
  id: string;
  name: string;
  color: string;
  category: string;
};

export type KanbanProject = {
  id: string;
  name: string;
  stageId: string;
  priority: string;
  position: number;
  quantity: number | null;
  targetDate: string | null;
  estRevenue: number | null;
  companyName: string | null;
};

export function KanbanBoard({
  stages,
  projects,
}: {
  stages: KanbanStage[];
  projects: KanbanProject[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(projects);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  // keep in sync when server data changes (unless mid-drag)
  if (
    projects.length !== items.length ||
    projects.some(
      (p, i) => items[i]?.id !== p.id || items[i]?.stageId !== p.stageId
    )
  ) {
    if (!dragId) setItems(projects);
  }

  function byStage(stageId: string) {
    return items
      .filter((p) => p.stageId === stageId)
      .sort((a, b) => a.position - b.position);
  }

  async function handleDrop(stageId: string, index: number) {
    const id = dragId;
    setDragId(null);
    setOverStage(null);
    if (!id) return;

    setItems((prev) => {
      const moving = prev.find((p) => p.id === id);
      if (!moving) return prev;
      const without = prev.filter((p) => p.id !== id);
      const target = without
        .filter((p) => p.stageId === stageId)
        .sort((a, b) => a.position - b.position);
      target.splice(Math.min(index, target.length), 0, { ...moving, stageId });
      const others = without.filter((p) => p.stageId !== stageId);
      const renumbered = target.map((p, i) => ({ ...p, position: i }));
      return [...others, ...renumbered];
    });

    await moveProject(id, stageId, index);
    router.refresh();
  }

  async function move(stageId: string, dir: -1 | 1) {
    const idx = stages.findIndex((s) => s.id === stageId);
    const swap = idx + dir;
    if (swap < 0 || swap >= stages.length) return;
    const order = stages.map((s) => s.id);
    [order[idx], order[swap]] = [order[swap], order[idx]];
    await reorderStages(order);
    router.refresh();
  }

  async function remove(stage: KanbanStage) {
    if (stages.length <= 1) {
      alert("You need at least one stage.");
      return;
    }
    const count = byStage(stage.id).length;
    const msg =
      count > 0
        ? `Delete "${stage.name}"? Its ${count} project${
            count === 1 ? "" : "s"
          } will move to "${
            stages.find((s) => s.id !== stage.id)?.name
          }".`
        : `Delete "${stage.name}"?`;
    if (!confirm(msg)) return;
    await deleteStage(stage.id);
    router.refresh();
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto px-8 py-6">
      {stages.map((stage, colIdx) => {
        const cards = byStage(stage.id);
        const revenue = cards.reduce((s, c) => s + (c.estRevenue ?? 0), 0);
        return (
          <div
            key={stage.id}
            className={`group/col flex w-72 shrink-0 flex-col rounded-xl border bg-slate-50/80 ${
              overStage === stage.id
                ? "border-brand-400 ring-2 ring-brand-100"
                : "border-slate-200"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage.id);
            }}
            onDrop={() => handleDrop(stage.id, cards.length)}
          >
            <div className="flex items-center justify-between gap-1 px-3 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="truncate text-sm font-semibold text-slate-700">
                  {stage.name}
                </span>
                <span className="rounded-full bg-slate-200 px-1.5 text-xs text-slate-500">
                  {cards.length}
                </span>
              </div>

              <div className="flex items-center gap-0.5 opacity-0 transition group-hover/col:opacity-100">
                <button
                  onClick={() => move(stage.id, -1)}
                  disabled={colIdx === 0}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30"
                  title="Move left"
                >
                  ‹
                </button>
                <button
                  onClick={() => move(stage.id, 1)}
                  disabled={colIdx === stages.length - 1}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30"
                  title="Move right"
                >
                  ›
                </button>
                <Modal
                  title="Edit stage"
                  trigger={(open) => (
                    <button
                      onClick={open}
                      className="rounded p-1 text-slate-400 hover:bg-slate-200"
                      title="Edit stage"
                    >
                      ✎
                    </button>
                  )}
                >
                  {(close) => (
                    <StageForm
                      action={async (fd) => {
                        await updateStage(stage.id, fd);
                        router.refresh();
                      }}
                      defaults={{
                        name: stage.name,
                        color: stage.color,
                        category: stage.category,
                      }}
                      submitLabel="Save changes"
                      onDone={close}
                    />
                  )}
                </Modal>
                <button
                  onClick={() => remove(stage)}
                  className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-500"
                  title="Delete stage"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-3 pb-1 text-xs text-slate-400">
              {formatCurrency(revenue)}
            </div>

            <div className="flex flex-1 flex-col gap-2 px-2 pb-3 pt-2">
              {cards.map((card, i) => (
                <div
                  key={card.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOverStage(stage.id);
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDrop(stage.id, i);
                  }}
                >
                  <Link
                    href={`/projects/${card.id}`}
                    draggable
                    onDragStart={() => setDragId(card.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverStage(null);
                    }}
                    className={`block cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing ${
                      dragId === card.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-tight text-slate-800">
                        {card.name}
                      </span>
                      <span
                        className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                        title={priorityMeta(card.priority).label}
                        style={{
                          backgroundColor: priorityMeta(card.priority).color,
                        }}
                      />
                    </div>
                    {card.companyName && (
                      <div className="mt-1 text-xs text-slate-500">
                        {card.companyName}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <span>{formatCurrency(card.estRevenue)}</span>
                      {card.targetDate && (
                        <span>{formatDate(card.targetDate)}</span>
                      )}
                    </div>
                  </Link>
                </div>
              ))}

              {cards.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-300">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add stage column */}
      <div className="flex w-64 shrink-0 items-start pt-3">
        <Modal
          title="New stage"
          trigger={(open) => (
            <button
              onClick={open}
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition hover:border-brand-400 hover:text-brand-600"
            >
              + Add stage
            </button>
          )}
        >
          {(close) => (
            <StageForm
              action={async (fd) => {
                await createStage(fd);
                router.refresh();
              }}
              submitLabel="Add stage"
              onDone={close}
            />
          )}
        </Modal>
      </div>
    </div>
  );
}
