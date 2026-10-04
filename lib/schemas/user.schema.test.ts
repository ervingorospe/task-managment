import { profileSchema, makeChangePasswordSchema } from "./user.schema";

describe("profileSchema", () => {
  const VALID = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@acmestudio.com",
    avatar: null,
  };

  it("accepts a valid profile with no avatar", () => {
    expect(profileSchema.safeParse(VALID).success).toBe(true);
  });

  it("accepts a valid profile with an avatar file", () => {
    const avatar = new File(["x"], "avatar.png");
    expect(profileSchema.safeParse({ ...VALID, avatar }).success).toBe(true);
  });

  it("rejects an empty first/last name", () => {
    expect(profileSchema.safeParse({ ...VALID, firstName: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...VALID, lastName: "" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(profileSchema.safeParse({ ...VALID, email: "not-an-email" }).success).toBe(
      false,
    );
  });
});

describe("makeChangePasswordSchema", () => {
  const VALID = {
    currentPassword: "oldpass123",
    newPassword: "newpassword123",
    confirmPassword: "newpassword123",
  };

  it("requires currentPassword when the account has one", () => {
    const schema = makeChangePasswordSchema(true);
    expect(schema.safeParse(VALID).success).toBe(true);
    expect(schema.safeParse({ ...VALID, currentPassword: "" }).success).toBe(false);
  });

  it("does not require currentPassword for an OAuth-only account", () => {
    const schema = makeChangePasswordSchema(false);
    const { currentPassword: _drop, ...withoutCurrent } = VALID;
    expect(schema.safeParse(withoutCurrent).success).toBe(true);
  });

  it("rejects a new password under 8 characters", () => {
    const schema = makeChangePasswordSchema(true);
    expect(
      schema.safeParse({ ...VALID, newPassword: "short", confirmPassword: "short" }).success,
    ).toBe(false);
  });

  it("rejects mismatched new/confirm passwords, flagging confirmPassword", () => {
    const schema = makeChangePasswordSchema(true);
    const result = schema.safeParse({ ...VALID, confirmPassword: "different" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });
});
