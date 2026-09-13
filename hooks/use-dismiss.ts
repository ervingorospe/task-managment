import { useEffect, type RefObject } from "react";

interface UseDismissOptions<T extends HTMLElement> {
  ref: RefObject<T | null>;
  onDismiss: () => void;
}

export function useDismiss<T extends HTMLElement>({
  ref,
  onDismiss,
}: UseDismissOptions<T>) {
  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (ref.current && !ref.current.contains(target)) {
        onDismiss();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref, onDismiss]);
}
