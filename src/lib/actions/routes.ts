"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createRoute(input: {
  name: string | null;
  date: string | null;
  optimized: boolean;
  distanceMiles: number | null;
  prospectIds: string[]; // already in visit order
}) {
  const stops = input.prospectIds.filter(Boolean);
  if (stops.length === 0) return;

  await prisma.route.create({
    data: {
      name: input.name?.trim() || null,
      // Parse a "YYYY-MM-DD" picker value as local midnight (a bare date string
      // is otherwise read as UTC and can display as the previous day).
      date: input.date ? new Date(`${input.date}T00:00:00`) : new Date(),
      optimized: input.optimized,
      distanceMiles: input.distanceMiles,
      stops: {
        create: stops.map((prospectId, order) => ({ prospectId, order })),
      },
    },
  });
  revalidatePath("/territory/routes");
}

export async function deleteRoute(id: string) {
  await prisma.route.delete({ where: { id } });
  revalidatePath("/territory/routes");
}

export async function toggleRouteStop(id: string, done: boolean) {
  await prisma.routeStop.update({ where: { id }, data: { done } });
  revalidatePath("/territory/routes");
}
