"use client";

import { useRef } from "react";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Paperclip, X } from "lucide-react";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 5;

type FileAttachmentInputProps<
  T extends FieldValues,
  N extends FieldPath<T> = FieldPath<T>,
> = {
  name: N;
  control: Control<T>;
  label?: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileAttachmentInput<T extends FieldValues>({
  name,
  control,
  label = "Attachments",
}: FileAttachmentInputProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({ name, control, defaultValue: [] as any });

  const inputRef = useRef<HTMLInputElement>(null);
  // defaultValue: [] above seeds this synchronously on first render.
  const files: File[] = field.value;

  // A real <input type="file">'s FileList is never null, even with zero
  // files selected (its own `Array.from` below just yields an empty
  // array in that case).
  function handleFilesSelected(selected: FileList) {
    const incoming = Array.from(selected);

    // Reject at selection time too, not just on submit — better feedback
    // than letting someone pick 8 files and only finding out at the end.
    const room = MAX_FILES - files.length;
    const accepted = incoming
      .slice(0, room)
      .filter((f) => f.size <= MAX_FILE_SIZE);

    field.onChange([...files, ...accepted]);
    // The ref is attached to the file input as soon as this component
    // mounts.
    inputRef.current!.value = "";
  }

  function removeFile(index: number) {
    field.onChange(files.filter((_, i) => i !== index));
  }

  const atLimit = files.length >= MAX_FILES;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium text-ink">
          {label} <span className="text-ink-faint">(optional)</span>
        </label>
        <span className="text-xs text-ink-faint">
          {files.length} / {MAX_FILES} · max 50MB each
        </span>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={atLimit}
        className="flex items-center gap-1.5 rounded border border-dashed border-line px-3 py-2 text-sm text-ink-muted hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Paperclip size={14} />
        {atLimit ? "File limit reached" : "Attach files"}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files!)}
        className="hidden"
      />

      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded border border-line bg-canvas px-2.5 py-1.5 text-xs"
            >
              <span className="truncate text-ink">
                {file.name} · {formatSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="ml-2 shrink-0 text-ink-faint hover:text-danger"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-1 text-xs text-danger">{error.message as string}</p>
      )}
    </div>
  );
}
