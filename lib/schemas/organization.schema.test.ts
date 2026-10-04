import {
  basicInfoSchema,
  settingsSchema,
  invitesSchema,
  rolesSchema,
  tagsSchema,
  roleFormSchema,
  projectFormSchema,
  changeOwnerSchema,
} from "./organization.schema";

describe("basicInfoSchema", () => {
  it("accepts a valid, fully-populated form", () => {
    expect(
      basicInfoSchema.safeParse({
        organizationName: "Acme Studio",
        email: "hello@acmestudio.com",
        website: "https://acmestudio.com",
        organizationDesc: "A design studio",
      }).success,
    ).toBe(true);
  });

  it("accepts empty optional fields (email/website/desc)", () => {
    expect(
      basicInfoSchema.safeParse({
        organizationName: "Acme Studio",
        email: "",
        website: "",
        organizationDesc: "",
      }).success,
    ).toBe(true);
  });

  it("rejects an organization name under 2 characters", () => {
    expect(basicInfoSchema.safeParse({ organizationName: "A" }).success).toBe(false);
  });

  it("rejects an invalid email when non-empty", () => {
    expect(
      basicInfoSchema.safeParse({ organizationName: "Acme", email: "not-an-email" })
        .success,
    ).toBe(false);
  });

  it("rejects an invalid website URL when non-empty", () => {
    expect(
      basicInfoSchema.safeParse({ organizationName: "Acme", website: "not-a-url" })
        .success,
    ).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("accepts a valid timezone with no logo", () => {
    expect(settingsSchema.safeParse({ timezone: "Asia/Manila" }).success).toBe(true);
  });

  it("rejects an empty timezone", () => {
    expect(settingsSchema.safeParse({ timezone: "" }).success).toBe(false);
  });
});

describe("invitesSchema", () => {
  it("accepts a valid list of invites", () => {
    expect(
      invitesSchema.safeParse({
        invites: [{ id: 1, email: "alex@clientco.com", roleId: 2 }],
      }).success,
    ).toBe(true);
  });

  it("rejects an invite with an invalid email", () => {
    expect(
      invitesSchema.safeParse({ invites: [{ id: 1, email: "bad", roleId: 2 }] }).success,
    ).toBe(false);
  });

  it("accepts an empty invites list", () => {
    expect(invitesSchema.safeParse({ invites: [] }).success).toBe(true);
  });
});

describe("rolesSchema", () => {
  it("accepts any array of roles", () => {
    expect(rolesSchema.safeParse({ roles: [{ anything: true }] }).success).toBe(true);
  });
});

describe("tagsSchema", () => {
  it("accepts a valid list of tags", () => {
    expect(
      tagsSchema.safeParse({
        tags: [{ id: 1, tagName: "To Do", color: "#000", isDefault: true }],
      }).success,
    ).toBe(true);
  });

  it("rejects a tag missing a required field", () => {
    expect(
      tagsSchema.safeParse({ tags: [{ id: 1, tagName: "To Do", color: "#000" }] }).success,
    ).toBe(false);
  });
});

describe("roleFormSchema", () => {
  const VALID = { roleName: "Admin", roleDesc: "Full access", rules: [1, 2] };

  it("accepts a valid role form", () => {
    expect(roleFormSchema.safeParse(VALID).success).toBe(true);
  });

  it("accepts an empty roleDesc", () => {
    expect(roleFormSchema.safeParse({ ...VALID, roleDesc: "" }).success).toBe(true);
  });

  it("rejects a role name under 2 characters", () => {
    expect(roleFormSchema.safeParse({ ...VALID, roleName: "A" }).success).toBe(false);
  });

  it("requires at least one selected rule", () => {
    expect(roleFormSchema.safeParse({ ...VALID, rules: [] }).success).toBe(false);
  });
});

describe("projectFormSchema", () => {
  const VALID = {
    name: "Website Revamp",
    description: "Redo the marketing site",
    clientId: "1",
    assigneeIds: [1, 2],
  };

  it("accepts a valid project form", () => {
    expect(projectFormSchema.safeParse(VALID).success).toBe(true);
  });

  it("accepts a null clientId", () => {
    expect(projectFormSchema.safeParse({ ...VALID, clientId: null }).success).toBe(true);
  });

  it("rejects a project name under 2 characters", () => {
    expect(projectFormSchema.safeParse({ ...VALID, name: "A" }).success).toBe(false);
  });
});

describe("changeOwnerSchema", () => {
  it("accepts a valid email", () => {
    expect(changeOwnerSchema.safeParse({ email: "new-owner@acmestudio.com" }).success).toBe(
      true,
    );
  });

  it("rejects an invalid email", () => {
    expect(changeOwnerSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});
