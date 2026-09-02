import { RiUploadCloud2Line } from "@remixicon/react";
import { Label } from "@/components/ui/label";

interface DocumentUploadFieldProps {
  id: string;
  label: string;
  hint?: string;
  onChange?: (file: File | null) => void;
}

function DocumentUploadField({ id, label, hint, onChange }: DocumentUploadFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <label
        htmlFor={id}
        className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded border border-dashed border-outline-variant bg-surface-container-low px-4 py-4 text-center text-label-sm text-on-surface-variant hover:bg-surface-container"
      >
        <RiUploadCloud2Line className="size-5" aria-hidden="true" />
        <span>Toque para enviar um arquivo</span>
        <input
          id={id}
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={(event) => onChange?.(event.target.files?.[0] ?? null)}
        />
      </label>
      {hint ? <p className="mt-1 text-mono-label text-on-surface-variant">{hint}</p> : null}
    </div>
  );
}

export { DocumentUploadField };
