import { useEffect } from "react";

/** Sets the browser tab title for pages that render client-side — App
 * Router's `metadata` export only works from a server component, which
 * most pages here aren't (they're client components reading route params
 * and fetched data). No restore-on-unmount: the next page sets its own
 * title immediately, so there's nothing to race. */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    if (title) document.title = `${title} | Work Orders`;
  }, [title]);
}
