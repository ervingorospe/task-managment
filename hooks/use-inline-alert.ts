import { useCallback, useEffect, useState } from "react";
import type { InlineAlertVariant } from "@/components/ui/inline-alert";
import { consumePendingAlert } from "@/lib/helper/pending-alert";

interface InlineAlertState {
  message: string;
  variant: InlineAlertVariant;
}

/** `const { alert, showAlert, dismissAlert } = useInlineAlert();` — pair
 * with <InlineAlert> rendered above the page's title. Local to whichever
 * page calls it, unlike useToast()'s global queue, since "above the
 * title" only makes sense per-page.
 *
 * Also picks up a pending alert set (via setPendingAlert) by whatever
 * page redirected here — e.g. deleting a ticket from its detail page
 * lands you on the list page, and that's where "Ticket X was removed"
 * actually belongs. Checked in an effect (not the initial state) so the
 * first render always matches SSR — no hydration mismatch — at the cost
 * of the banner appearing one tick after mount instead of immediately. */
export function useInlineAlert() {
  const [alert, setAlert] = useState<InlineAlertState | null>(null);

  useEffect(() => {
    const pending = consumePendingAlert();
    if (pending) setAlert(pending);
  }, []);

  const showAlert = useCallback(
    (message: string, variant: InlineAlertVariant = "success") => {
      setAlert({ message, variant });
    },
    [],
  );

  const dismissAlert = useCallback(() => setAlert(null), []);

  return { alert, showAlert, dismissAlert };
}
