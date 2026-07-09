"use client";

import { Modal } from "@/components/Modal";
import { CompanyForm, ContactForm, VendorForm } from "@/components/forms";
import {
  createCompany,
  updateCompany,
  createContact,
  updateContact,
  createVendor,
  updateVendor,
} from "@/lib/actions/entities";

type Option = { id: string; label: string };
type Defaults = Record<string, string | null | undefined>;

/* ---------- Companies ---------- */

export function NewCompanyButton() {
  return (
    <Modal
      title="New company"
      wide
      trigger={(open) => (
        <button className="btn-primary" onClick={open}>
          + New company
        </button>
      )}
    >
      {(close) => (
        <CompanyForm action={createCompany} submitLabel="Create company" onDone={close} />
      )}
    </Modal>
  );
}

export function EditCompanyButton({ id, defaults }: { id: string; defaults: Defaults }) {
  return (
    <Modal
      title="Edit company"
      wide
      trigger={(open) => (
        <button className="text-xs text-slate-500 hover:text-brand-600" onClick={open}>
          Edit
        </button>
      )}
    >
      {(close) => (
        <CompanyForm
          action={updateCompany.bind(null, id)}
          defaults={defaults}
          submitLabel="Save changes"
          onDone={close}
        />
      )}
    </Modal>
  );
}

/* ---------- Contacts ---------- */

export function NewContactButton({ companies }: { companies: Option[] }) {
  return (
    <Modal
      title="New contact"
      wide
      trigger={(open) => (
        <button className="btn-primary" onClick={open}>
          + New contact
        </button>
      )}
    >
      {(close) => (
        <ContactForm
          action={createContact}
          companies={companies}
          submitLabel="Create contact"
          onDone={close}
        />
      )}
    </Modal>
  );
}

export function EditContactButton({
  id,
  companies,
  defaults,
}: {
  id: string;
  companies: Option[];
  defaults: Defaults;
}) {
  return (
    <Modal
      title="Edit contact"
      wide
      trigger={(open) => (
        <button className="text-xs text-slate-500 hover:text-brand-600" onClick={open}>
          Edit
        </button>
      )}
    >
      {(close) => (
        <ContactForm
          action={updateContact.bind(null, id)}
          companies={companies}
          defaults={defaults}
          submitLabel="Save changes"
          onDone={close}
        />
      )}
    </Modal>
  );
}

/* ---------- Vendors ---------- */

export function NewVendorButton() {
  return (
    <Modal
      title="New vendor"
      wide
      trigger={(open) => (
        <button className="btn-primary" onClick={open}>
          + New vendor
        </button>
      )}
    >
      {(close) => (
        <VendorForm action={createVendor} submitLabel="Create vendor" onDone={close} />
      )}
    </Modal>
  );
}

export function EditVendorButton({ id, defaults }: { id: string; defaults: Defaults }) {
  return (
    <Modal
      title="Edit vendor"
      wide
      trigger={(open) => (
        <button className="text-xs text-slate-500 hover:text-brand-600" onClick={open}>
          Edit
        </button>
      )}
    >
      {(close) => (
        <VendorForm
          action={updateVendor.bind(null, id)}
          defaults={defaults}
          submitLabel="Save changes"
          onDone={close}
        />
      )}
    </Modal>
  );
}
