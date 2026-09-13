// lib/lazy-named.ts
import dynamic from "next/dynamic";

export function lazyNamed<T extends Record<string, any>, K extends keyof T>(
  importFn: () => Promise<T>,
  exportName: K,
) {
  return dynamic(() => importFn().then((mod) => mod[exportName]), {
    ssr: false,
  }) as T[K];
}
