import { replaceUrlSlug } from "./replace-url-slug";

it("replaces the slug after /organizations/", () => {
  expect(replaceUrlSlug("/dashboard/organizations/acme-studio/tickets", "new-slug")).toBe(
    "/dashboard/organizations/new-slug/tickets",
  );
});

it("replaces the slug after /organization/ (singular)", () => {
  expect(replaceUrlSlug("/dashboard/organization/acme-studio", "new-slug")).toBe(
    "/dashboard/organization/new-slug",
  );
});

it("replaces the slug after /reports/", () => {
  expect(replaceUrlSlug("/dashboard/reports/acme-studio", "new-slug")).toBe(
    "/dashboard/reports/new-slug",
  );
});

it("returns the pathname unchanged when no known segment is present", () => {
  expect(replaceUrlSlug("/dashboard/tickets", "new-slug")).toBe("/dashboard/tickets");
});

it("returns the pathname unchanged when the slug segment is missing entirely", () => {
  expect(replaceUrlSlug("/dashboard/organizations", "new-slug")).toBe(
    "/dashboard/organizations",
  );
});
