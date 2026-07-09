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
