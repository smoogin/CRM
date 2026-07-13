import { prisma } from "@/lib/prisma";
import { RoutesClient } from "@/components/RoutesClient";

export const dynamic = "force-dynamic";

export default async function RoutesPage() {
  const routes = await prisma.route.findMany({
    orderBy: { date: "desc" },
    include: {
      stops: {
        orderBy: { order: "asc" },
        include: {
          prospect: { select: { name: true, lat: true, lng: true, county: true } },
        },
      },
    },
  });

  return (
    <RoutesClient
      routes={routes.map((r) => ({
        id: r.id,
        name: r.name,
        date: r.date.toISOString(),
        optimized: r.optimized,
        distanceMiles: r.distanceMiles,
        stops: r.stops.map((s) => ({
          id: s.id,
          order: s.order,
          done: s.done,
          prospectName: s.prospect.name,
          county: s.prospect.county,
          lat: s.prospect.lat,
          lng: s.prospect.lng,
        })),
      }))}
    />
  );
}
