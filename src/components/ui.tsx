import Link from "next/link";
import { priorityMeta } from "@/lib/constants";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-slate-200 bg-white px-8 py-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function StageBadge({
  stage,
}: {
  stage: { name: string; color: string } | null | undefined;
}) {
  if (!stage) return <span className="text-slate-400">—</span>;
  return (
    <span
      className="badge"
      style={{ backgroundColor: `${stage.color}1a`, color: stage.color }}
    >
      {stage.name}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: string }) {
  const m = priorityMeta(priority);
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: m.color }}
      />
      {m.label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <div className="card p-5 transition-shadow hover:shadow-md">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-800">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
