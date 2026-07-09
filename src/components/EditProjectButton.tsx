"use client";

import { Modal } from "@/components/Modal";
import { ProjectForm } from "@/components/ProjectForm";
import { updateProject } from "@/lib/actions/projects";

type Option = { id: string; label: string };

export function EditProjectButton({
  id,
  companies,
  contacts,
  stages,
  defaults,
}: {
  id: string;
  companies: Option[];
  contacts: Option[];
  stages: Option[];
  defaults: Parameters<typeof ProjectForm>[0]["defaults"];
}) {
  const boundUpdate = updateProject.bind(null, id);
  return (
    <Modal
      title="Edit project"
      wide
      trigger={(open) => (
        <button className="btn-ghost" onClick={open}>
          Edit
        </button>
      )}
    >
      {(close) => (
        <ProjectForm
          action={boundUpdate}
          companies={companies}
          contacts={contacts}
          stages={stages}
          defaults={defaults}
          submitLabel="Save changes"
          onDone={close}
        />
      )}
    </Modal>
  );
}
