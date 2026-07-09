import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import {
  KanbanBoard,
  type KanbanProject,
  type KanbanStage,
} from "@/components/KanbanBoard";
import { NewProjectButton } from "@/components/NewProjectButton";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [stages, projects, companies, contacts] = await Promise.all([
    prisma.stage.findMany({ orderBy: { position: "asc" } }),
    prisma.project.findMany({
      orderBy: [{ position: "asc" }],
      include: { company: { select: { name: true } } },
    }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.contact.findMany({ orderBy: { lastName: "asc" } }),
  ]);

  const stageData: KanbanStage[] = stages.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    category: s.category,
  }));

  const cards: KanbanProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    stageId: p.stageId,
    priority: p.priority,
    position: p.position,
    quantity: p.quantity,
    targetDate: p.targetDate ? p.targetDate.toISOString() : null,
    estRevenue: p.estRevenue,
    companyName: p.company?.name ?? null,
  }));

  const companyOpts = companies.map((c) => ({ id: c.id, label: c.name }));
  const contactOpts = contacts.map((c) => ({
    id: c.id,
    label: `${c.firstName} ${c.lastName}`,
  }));
  const stageOpts = stages.map((s) => ({ id: s.id, label: s.name }));

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Projects"
        subtitle="Drag cards between stages · hover a column to edit or delete it"
        action={
          <NewProjectButton
            companies={companyOpts}
            contacts={contactOpts}
            stages={stageOpts}
          />
        }
      />
      <div className="min-h-0 flex-1">
        <KanbanBoard stages={stageData} projects={cards} />
      </div>
    </div>
  );
}
