import { prisma } from "@/lib/prisma";
import { healthScore } from "@/lib/constants";
import { TerritoryClient } from "@/components/TerritoryClient";

export const dynamic = "force-dynamic";

export default async function TerritoryPage() {
  const prospects = await prisma.prospect.findMany({
    orderBy: { name: "asc" },
    include: { visits: { orderBy: { date: "desc" } } },
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
      }))}
    />
  );
}
