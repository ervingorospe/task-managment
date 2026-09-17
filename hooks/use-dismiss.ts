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

      // Portaled floating panels (Dropdown, color picker, multi-select)
      // render via createPortal to document.body, so DOM-wise they're
      // siblings of whatever wraps them, not descendants. Without this
      // check, clicking inside a dropdown nested in a Modal looks
      // identical to clicking outside the Modal, and closes it.
      if (
        target instanceof Element &&
        target.closest("[data-floating-panel]")
      ) {
        return;
      }

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
