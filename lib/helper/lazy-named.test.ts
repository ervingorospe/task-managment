// next/dynamic's real implementation renders a loading state and code-splits
// — irrelevant to what this helper actually does (pick a named export out
// of a dynamically-imported module). Stand in with a version that just
// resolves the importer immediately and returns the picked export, so the
// test verifies lazyNamed's own logic instead of Next's bundler behavior.
jest.mock("next/dynamic", () => (loader: () => Promise<unknown>) => loader());

import { lazyNamed } from "./lazy-named";

it("resolves the module and returns the named export", async () => {
  const fakeModule = { MyComponent: () => null, Other: () => null };
  const result = lazyNamed(() => Promise.resolve(fakeModule), "MyComponent");
  expect(await result).toBe(fakeModule.MyComponent);
});
