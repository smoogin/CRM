import { prisma } from "@/lib/prisma";
import { healthScore } from "@/lib/constants";
import { TerritoryClient } from "@/components/TerritoryClient";

export const dynamic = "force-dynamic";

export default async function TerritoryPage() {
  const prospects = await prisma.prospect.findMany({
    orderBy: { name: "asc" },
    include: {
      visits: { orderBy: { date: "desc" } },
      inventory: { orderBy: { dateCaptured: "desc" } },
      expenses: { orderBy: { date: "desc" } },
    },
  });

  return (
    <TerritoryClient
      prospects={prospects.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        county: p.county,
        status: p.status,
        vertical: p.vertical,
        dealValueEstimate: p.dealValueEstimate,
        lastContactDate: p.lastContactDate?.toISOString() ?? null,
        notes: p.notes,
        health: healthScore(p.lastContactDate, p.createdAt),
        visits: p.visits.map((v) => ({
          id: v.id,
          type: v.type,
          notes: v.notes,
          date: v.date.toISOString(),
          xpAwarded: v.xpAwarded,
        })),
        inventory: p.inventory.map((i) => ({
          id: i.id,
          packagingType: i.packagingType,
          notes: i.notes,
          mimeType: i.mimeType,
          dateCaptured: i.dateCaptured.toISOString(),
        })),
        expenses: p.expenses.map((e) => ({
          id: e.id,
          type: e.type,
          amount: e.amount,
          miles: e.miles,
          notes: e.notes,
          date: e.date.toISOString(),
        })),
      }))}
    />
  );
}
