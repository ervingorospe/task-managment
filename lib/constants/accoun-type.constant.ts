export const ACCOUNT_TYPE = {
  MEMBER: "member",
  OWNER: "owner",
} as const;

export type AccountType = (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE];
