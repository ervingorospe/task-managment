"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-4 flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={15} />
      Back
    </button>
  );
}
