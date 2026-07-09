"use client";

export function DeleteButton({
  action,
  label = "Delete",
  confirmText = "Delete this item? This cannot be undone.",
  className = "btn-danger",
  small,
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
  className?: string;
  small?: boolean;
}) {
  return (
    <form
      action={async () => {
        await action();
      }}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className="inline"
    >
      <button className={small ? "text-xs text-red-500 hover:underline" : className}>
        {label}
      </button>
    </form>
  );
}
