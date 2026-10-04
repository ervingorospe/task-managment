"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface ClampedTextProps {
  text: string;
  href: string;
  /** Defaults to the shared 2-line clamp used across list views. */
  className?: string;
}

/** Plain-text paragraph clamped via CSS, with a "View more" link that only shows once the text actually overflows. */
export function ClampedText({
  text,
  href,
  className = "ticket-description-preview",
}: ClampedTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    // Let the browser render the text first.
    requestAnimationFrame(() => {
      if (!ref.current) return;
      setIsTruncated(ref.current.scrollHeight > ref.current.clientHeight + 1);
    });
  }, [text]);

  return (
    <div>
      <p ref={ref} className={className}>
        {text}
      </p>

      {isTruncated && (
        <Link
          href={href}
          className="mt-1 inline-block text-xs font-medium text-accent-text hover:underline"
        >
          View more
        </Link>
      )}
    </div>
  );
}
