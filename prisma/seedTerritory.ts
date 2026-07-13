import { PrismaClient } from "@prisma/client";
import { VISIT_TYPES } from "../src/lib/constants";

// Standalone seed for the Territory tab. Unlike the main seed it ONLY touches
// Prospect/VisitLog, so it can be run without wiping the rest of the CRM.
// Coordinates are pre-set (real Michigan cities) so no live geocoding is needed.
const prisma = new PrismaClient();

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

function xpFor(type: string, status: string) {
  const base = VISIT_TYPES.find((v) => v.key === type)?.xp ?? 10;
  return base * (status === "cold" || status === "dormant" ? 2 : 1);
}

type Seed = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  county: string;
  status: string;
  vertical: string;
  dealValueEstimate: number;
  lastContactDays: number | null;
  visits?: { type: string; notes: string; days: number }[];
};

const PROSPECTS: Seed[] = [
  {
    name: "Motor City Stampings",
    address: "2000 Industrial Ave, Detroit, MI",
    lat: 42.3314, lng: -83.0458, county: "Wayne",
    status: "hot", vertical: "Automotive Tier 2-3", dealValueEstimate: 120000,
    lastContactDays: 4,
    visits: [
      { type: "meeting", notes: "Toured line, needs corrugated dividers for transmission parts.", days: 4 },
      { type: "cold call", notes: "First contact, receptive.", days: 32 },
    ],
  },
  {
    name: "Warren Precision Components",
    address: "500 Van Dyke Ave, Warren, MI",
    lat: 42.5145, lng: -83.0147, county: "Macomb",
    status: "warm", vertical: "Automotive Tier 2-3", dealValueEstimate: 85000,
    lastContactDays: 12,
    visits: [{ type: "check-in", notes: "Dropped samples of foam inserts.", days: 12 }],
  },
  {
    name: "Troy Metal Works",
    address: "1200 Rochester Rd, Troy, MI",
    lat: 42.6056, lng: -83.1499, county: "Oakland",
    status: "warm", vertical: "Automotive Tier 2-3", dealValueEstimate: 64000,
    lastContactDays: 20,
  },
  {
    name: "Kellanova Snacks",
    address: "1 Battle Creek Plaza, Battle Creek, MI",
    lat: 42.3212, lng: -85.1797, county: "Calhoun",
    status: "hot", vertical: "Food & Beverage", dealValueEstimate: 210000,
    lastContactDays: 7,
    visits: [{ type: "meeting", notes: "Shelf-ready carton redesign RFQ due next month.", days: 7 }],
  },
  {
    name: "Great Lakes Provisions",
    address: "300 Monroe Ave NW, Grand Rapids, MI",
    lat: 42.9634, lng: -85.6681, county: "Kent",
    status: "warm", vertical: "Food & Beverage", dealValueEstimate: 48000,
    lastContactDays: 40,
  },
  {
    name: "Cherry Republic Foods",
    address: "6026 S Lake St, Traverse City, MI",
    lat: 44.7631, lng: -85.6206, county: "Grand Traverse",
    status: "cold", vertical: "Food & Beverage", dealValueEstimate: 30000,
    lastContactDays: null,
  },
  {
    name: "Stryker Instruments",
    address: "1941 Stryker Way, Kalamazoo, MI",
    lat: 42.2917, lng: -85.5872, county: "Kalamazoo",
    status: "hot", vertical: "Medical", dealValueEstimate: 175000,
    lastContactDays: 9,
    visits: [{ type: "meeting", notes: "Sterile-barrier packaging discussion. Compliance-heavy.", days: 9 }],
  },
  {
    name: "Ann Arbor Medical Devices",
    address: "2800 Plymouth Rd, Ann Arbor, MI",
    lat: 42.2808, lng: -83.743, county: "Washtenaw",
    status: "warm", vertical: "Medical", dealValueEstimate: 92000,
    lastContactDays: 25,
  },
  {
    name: "Genesee Ag Supply",
    address: "4100 W Pierson Rd, Flint, MI",
    lat: 43.0125, lng: -83.6875, county: "Genesee",
    status: "cold", vertical: "Ag", dealValueEstimate: 40000,
    lastContactDays: 70,
  },
  {
    name: "Saginaw Valley Grain",
    address: "1000 N Michigan Ave, Saginaw, MI",
    lat: 43.4195, lng: -83.9508, county: "Saginaw",
    status: "dormant", vertical: "Ag", dealValueEstimate: 55000,
    lastContactDays: 120,
  },
  {
    name: "Lakeshore Fulfillment 3PL",
    address: "700 E 40th St, Holland, MI",
    lat: 42.7875, lng: -86.1089, county: "Ottawa",
    status: "hot", vertical: "E-commerce / 3PL", dealValueEstimate: 140000,
    lastContactDays: 3,
    visits: [{ type: "check-in", notes: "Peak season prep — mailers and void fill volume.", days: 3 }],
  },
  {
    name: "Great Lakes Arms",
    address: "12000 Merriman Rd, Livonia, MI",
    lat: 42.3684, lng: -83.3527, county: "Wayne",
    status: "cold", vertical: "Firearms", dealValueEstimate: 38000,
    lastContactDays: 55,
  },
  {
    name: "Capital Ag Cooperative",
    address: "500 S Cedar St, Lansing, MI",
    lat: 42.7325, lng: -84.5555, county: "Ingham",
    status: "warm", vertical: "Ag", dealValueEstimate: 47000,
    lastContactDays: 18,
  },
];

async function main() {
  await prisma.visitLog.deleteMany();
  await prisma.prospect.deleteMany();

  for (const s of PROSPECTS) {
    await prisma.prospect.create({
      data: {
        name: s.name,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        county: s.county,
        status: s.status,
        vertical: s.vertical,
        dealValueEstimate: s.dealValueEstimate,
        lastContactDate: s.lastContactDays == null ? null : daysAgo(s.lastContactDays),
        visits: {
          create: (s.visits ?? []).map((v) => ({
            type: v.type,
            notes: v.notes,
            date: daysAgo(v.days),
            xpAwarded: xpFor(v.type, s.status),
          })),
        },
      },
    });
  }

  console.log(`Seeded ${PROSPECTS.length} territory prospects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
