"use client";

import { useEffect, useRef, useState } from "react";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Pencil } from "lucide-react";
import Avatar from "@/components/ui/avatar";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type AvatarUploadProps<
  T extends FieldValues,
  N extends FieldPath<T> = FieldPath<T>,
> = {
  name: N;
  control: Control<T>;
  firstName: string;
  lastName?: string;
  /** The avatar currently on file, shown until a new one is picked. */
  currentSrc?: string | null;
};

export default function AvatarUpload<T extends FieldValues>({
  name,
  control,
  firstName,
  lastName,
  currentSrc,
}: AvatarUploadProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  const inputRef = useRef<HTMLInputElement>(null);
  const file: File | null = field.value ?? null;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFileSelected(selected: FileList | null) {
    const picked = selected?.[0];
    if (!picked) return;

    if (picked.size > MAX_FILE_SIZE) {
      field.onChange(null);
      return;
    }

    field.onChange(picked);
    // The ref is attached to the file input as soon as this component
    // mounts, so it's always available here.
    inputRef.current!.value = "";
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar
            firstName={firstName}
            lastName={lastName}
            src={previewUrl ?? currentSrc ?? undefined}
            size="xl"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Change avatar"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-ink text-accent hover:bg-ink/90"
          >
            <Pencil size={12} />
          </button>
        </div>

        <div className="text-xs text-ink-muted">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-medium text-accent-text hover:underline"
          >
            Change photo
          </button>
          <p className="mt-0.5">JPG, PNG, or GIF. Max 5MB.</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelected(e.target.files)}
        className="hidden"
      />

      {error && (
        <p className="mt-1.5 text-xs text-danger">{error.message as string}</p>
      )}
    </div>
  );
}
