// Stages now live in the database (see Stage model). These are only used to
// seed a sensible starting set of columns on a fresh database.
export const DEFAULT_STAGES = [
  { name: "Lead", color: "#64748b", category: "OPEN" },
  { name: "Quoting", color: "#f59e0b", category: "OPEN" },
  { name: "Sampling", color: "#8b5cf6", category: "OPEN" },
  { name: "Won", color: "#10b981", category: "WON" },
  { name: "Production", color: "#0ea5e9", category: "WON" },
  { name: "Delivered", color: "#22c55e", category: "WON" },
  { name: "Lost", color: "#ef4444", category: "LOST" },
] as const;

export const STAGE_CATEGORIES = [
  { key: "OPEN", label: "Open pipeline" },
  { key: "WON", label: "Won / in progress" },
  { key: "LOST", label: "Lost" },
] as const;

// Palette offered in the stage color picker.
export const STAGE_COLORS = [
  "#64748b",
  "#ef4444",
  "#f59e0b",
  "#eab308",
  "#22c55e",
  "#10b981",
  "#0ea5e9",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export const PRIORITIES = [
  { key: "LOW", label: "Low", color: "#94a3b8" },
  { key: "MEDIUM", label: "Medium", color: "#f59e0b" },
  { key: "HIGH", label: "High", color: "#ef4444" },
] as const;

export const VENDOR_CATEGORIES = [
  "Corrugated",
  "Folding Carton",
  "Films & Flexibles",
  "Labels",
  "Foam & Protective",
  "Rigid / Plastics",
  "Tape & Adhesives",
  "Pallets & Wood",
  "Other",
];

export const FINANCIAL_CATEGORIES = [
  "Materials",
  "Freight",
  "Tooling",
  "Commission",
  "Labor",
  "Sample",
  "Other",
];

/* ---------------- Territory ---------------- */

export const PROSPECT_STATUSES = [
  { key: "cold", label: "Cold", color: "#3b82f6" },
  { key: "warm", label: "Warm", color: "#f59e0b" },
  { key: "hot", label: "Hot", color: "#ef4444" },
  { key: "customer", label: "Customer", color: "#10b981" },
  { key: "dormant", label: "Dormant", color: "#94a3b8" },
] as const;

export const PROSPECT_VERTICALS = [
  "Firearms",
  "Automotive Tier 2-3",
  "Food & Beverage",
  "Medical",
  "Ag",
  "E-commerce / 3PL",
  "Other",
];

export const VISIT_TYPES = [
  { key: "cold call", label: "Cold call", xp: 10 },
  { key: "check-in", label: "Check-in", xp: 15 },
  { key: "meeting", label: "Meeting", xp: 25 },
  { key: "call", label: "Phone call", xp: 10 },
  { key: "drop-off", label: "Drop-off", xp: 10 },
] as const;

export const PACKAGING_TYPES = [
  "Rigid box",
  "Folding carton",
  "Sleeve",
  "Clamshell",
  "Backer card",
  "POP display",
  "Other",
];

export const EXPENSE_TYPES = [
  { key: "gas", label: "Gas", color: "#0ea5e9" },
  { key: "meal", label: "Meal", color: "#f59e0b" },
  { key: "gift", label: "Gift", color: "#ec4899" },
  { key: "other", label: "Other", color: "#94a3b8" },
] as const;

// IRS 2025 standard business mileage rate ($/mile) for gas auto-calc.
export const MILEAGE_RATE = 0.7;

export function expenseTypeMeta(key: string) {
  return EXPENSE_TYPES.find((e) => e.key === key) ?? EXPENSE_TYPES[3];
}

export function statusMeta(key: string) {
  return PROSPECT_STATUSES.find((s) => s.key === key) ?? PROSPECT_STATUSES[0];
}

export function visitTypeMeta(key: string) {
  return VISIT_TYPES.find((v) => v.key === key) ?? VISIT_TYPES[0];
}

// Health decays after a 2-week grace period, -5 points per week thereafter.
// Drives the map pin fade ("this account needs attention").
export function healthScore(
  lastContactDate: Date | string | null | undefined,
  createdAt: Date | string,
): number {
  const ref = lastContactDate ?? createdAt;
  const days = (Date.now() - new Date(ref).getTime()) / 86400000;
  const decayed = Math.max(0, days - 14) / 7 * 5;
  return Math.max(0, Math.min(100, Math.round(100 - decayed)));
}

export function healthMeta(score: number) {
  if (score >= 70) return { label: "Healthy", color: "#10b981" };
  if (score >= 40) return { label: "Cooling", color: "#f59e0b" };
  return { label: "Needs attention", color: "#ef4444" };
}

export function priorityMeta(key: string) {
  return PRIORITIES.find((p) => p.key === key) ?? PRIORITIES[1];
}

export function formatCurrency(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
