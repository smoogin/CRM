"use client";

import { Modal } from "@/components/Modal";
import { ProjectForm } from "@/components/ProjectForm";
import { createProject } from "@/lib/actions/projects";

type Option = { id: string; label: string };

export function NewProjectButton({
  companies,
  contacts,
  stages,
}: {
  companies: Option[];
  contacts: Option[];
  stages: Option[];
}) {
  return (
    <Modal
      title="New project"
      wide
      trigger={(open) => (
        <button className="btn-primary" onClick={open}>
          + New project
        </button>
      )}
    >
      {(close) => (
        <ProjectForm
          action={createProject}
          companies={companies}
          contacts={contacts}
          stages={stages}
          submitLabel="Create project"
          onDone={close}
        />
      )}
    </Modal>
  );
}
