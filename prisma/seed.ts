import { PrismaClient } from "@prisma/client";
import { DEFAULT_STAGES } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  // wipe (order matters for FKs)
  await prisma.financialEntry.deleteMany();
  await prisma.projectVendor.deleteMany();
  await prisma.project.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.vendor.deleteMany();

  // Kanban stages
  const stageByName: Record<string, string> = {};
  for (let i = 0; i < DEFAULT_STAGES.length; i++) {
    const s = DEFAULT_STAGES[i];
    const created = await prisma.stage.create({
      data: { name: s.name, color: s.color, category: s.category, position: i },
    });
    stageByName[s.name] = created.id;
  }

  const acme = await prisma.company.create({
    data: {
      name: "Acme Foods Co.",
      industry: "Food & Beverage",
      website: "https://acmefoods.example",
      phone: "(312) 555-0142",
      city: "Chicago",
      state: "IL",
    },
  });

  const brightware = await prisma.company.create({
    data: {
      name: "Brightware Electronics",
      industry: "Consumer Electronics",
      website: "https://brightware.example",
      phone: "(408) 555-0199",
      city: "San Jose",
      state: "CA",
    },
  });

  const greenfield = await prisma.company.create({
    data: {
      name: "Greenfield Organics",
      industry: "Health & Beauty",
      phone: "(503) 555-0177",
      city: "Portland",
      state: "OR",
    },
  });

  const jane = await prisma.contact.create({
    data: {
      firstName: "Jane",
      lastName: "Doe",
      title: "Procurement Manager",
      email: "jane.doe@acmefoods.example",
      phone: "(312) 555-0143",
      companyId: acme.id,
    },
  });

  const mike = await prisma.contact.create({
    data: {
      firstName: "Mike",
      lastName: "Chen",
      title: "Ops Director",
      email: "mike.chen@brightware.example",
      companyId: brightware.id,
    },
  });

  await prisma.contact.create({
    data: {
      firstName: "Sara",
      lastName: "Nguyen",
      title: "Brand Lead",
      email: "sara@greenfield.example",
      companyId: greenfield.id,
    },
  });

  const boxco = await prisma.vendor.create({
    data: {
      name: "BoxCo Corrugated",
      category: "Corrugated",
      contactName: "Tom Reyes",
      email: "sales@boxco.example",
      phone: "(800) 555-0100",
      leadTimeDays: 14,
      rating: 4,
    },
  });

  const filmpro = await prisma.vendor.create({
    data: {
      name: "FilmPro Flexibles",
      category: "Films & Flexibles",
      contactName: "Nina Patel",
      email: "hello@filmpro.example",
      leadTimeDays: 21,
      rating: 5,
    },
  });

  const labelworks = await prisma.vendor.create({
    data: {
      name: "LabelWorks",
      category: "Labels",
      leadTimeDays: 7,
      rating: 4,
    },
  });

  const p1 = await prisma.project.create({
    data: {
      name: "Retail carton redesign",
      description: "New shelf-ready corrugated carton for cereal line.",
      stageId: stageByName["Quoting"],
      priority: "HIGH",
      position: 0,
      quantity: 50000,
      estRevenue: 42000,
      estCost: 27000,
      companyId: acme.id,
      contactId: jane.id,
      targetDate: new Date("2026-09-15"),
    },
  });

  const p2 = await prisma.project.create({
    data: {
      name: "Protective foam inserts",
      description: "Custom foam for tablet packaging.",
      stageId: stageByName["Sampling"],
      priority: "MEDIUM",
      position: 0,
      quantity: 12000,
      estRevenue: 88000,
      estCost: 61000,
      companyId: brightware.id,
      contactId: mike.id,
      targetDate: new Date("2026-08-30"),
    },
  });

  const p3 = await prisma.project.create({
    data: {
      name: "Compostable pouch line",
      description: "Flexible compostable pouches for tea.",
      stageId: stageByName["Won"],
      priority: "HIGH",
      position: 0,
      quantity: 100000,
      estRevenue: 135000,
      estCost: 92000,
      companyId: greenfield.id,
      targetDate: new Date("2026-10-01"),
    },
  });

  await prisma.project.create({
    data: {
      name: "Seasonal label refresh",
      stageId: stageByName["Lead"],
      priority: "LOW",
      position: 0,
      estRevenue: 18000,
      estCost: 11000,
      companyId: acme.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Pallet optimization study",
      stageId: stageByName["Production"],
      priority: "MEDIUM",
      position: 0,
      estRevenue: 24000,
      estCost: 15000,
      companyId: brightware.id,
    },
  });

  await prisma.projectVendor.createMany({
    data: [
      { projectId: p1.id, vendorId: boxco.id, role: "Corrugated carton", quotedCost: 24000 },
      { projectId: p1.id, vendorId: labelworks.id, role: "Printed labels", quotedCost: 3000 },
      { projectId: p2.id, vendorId: boxco.id, role: "Outer boxes", quotedCost: 12000 },
      { projectId: p3.id, vendorId: filmpro.id, role: "Compostable film", quotedCost: 85000 },
    ],
  });

  await prisma.financialEntry.createMany({
    data: [
      { projectId: p3.id, type: "REVENUE", category: "Materials", label: "PO #1042 deposit", amount: 67500 },
      { projectId: p3.id, type: "COST", category: "Materials", label: "FilmPro film order", amount: 85000 },
      { projectId: p3.id, type: "COST", category: "Freight", label: "Inbound freight", amount: 2200 },
      { projectId: p1.id, type: "COST", category: "Sample", label: "Prototype cartons", amount: 850 },
    ],
  });

  console.log("Seeded sample CRM data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
