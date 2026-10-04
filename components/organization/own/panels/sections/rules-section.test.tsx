jest.mock("@/providers/organization-defaults.provider", () => ({
  useOrganizationDefaults: jest.fn(),
}));

import { render, screen } from "@testing-library/react";
import RulesSection from "./rules-section";
import { useOrganizationDefaults } from "@/providers/organization-defaults.provider";
import type { Rule } from "@/lib/types/rule/rule.type";
import type { RuleCategory } from "@/lib/types/rule/rule-category.type";

const mockedUseOrgDefaults = useOrganizationDefaults as jest.Mock;

const TICKET_VIEW: Rule = { id: 1, action: "ticket.view", name: "View tickets", desc: "Can view tickets", categoryId: 1 };
const TICKET_UPDATE: Rule = { id: 2, action: "ticket.update", name: "Update tickets", desc: "", categoryId: 1 };
const MEMBER_INVITE: Rule = { id: 3, action: "member.invite", name: "Invite members", desc: "", categoryId: 2 };
const UNCATEGORIZED: Rule = { id: 4, action: "misc.rule", name: "Misc rule", desc: "", categoryId: 999 };

const CATEGORIES: RuleCategory[] = [
  { id: 1, name: "Tickets" },
  { id: 2, name: "Members" },
];

it("shows the title and subtitle", () => {
  mockedUseOrgDefaults.mockReturnValue({ permissionOptions: [], ruleCategories: [] });
  render(<RulesSection />);
  expect(screen.getByText("Rules")).toBeInTheDocument();
  expect(
    screen.getByText("The full set of permissions available in the system. Not editable here."),
  ).toBeInTheDocument();
});

it("groups rules by category, including a description when present", () => {
  mockedUseOrgDefaults.mockReturnValue({
    permissionOptions: [TICKET_VIEW, TICKET_UPDATE, MEMBER_INVITE],
    ruleCategories: CATEGORIES,
  });
  render(<RulesSection />);
  expect(screen.getByText("Tickets")).toBeInTheDocument();
  expect(screen.getByText("View tickets")).toBeInTheDocument();
  expect(screen.getByText("Can view tickets")).toBeInTheDocument();
  expect(screen.getByText("Update tickets")).toBeInTheDocument();
  expect(screen.getByText("Members")).toBeInTheDocument();
  expect(screen.getByText("Invite members")).toBeInTheDocument();
});

it("falls back to 'Other' for an unresolved category", () => {
  mockedUseOrgDefaults.mockReturnValue({
    permissionOptions: [UNCATEGORIZED],
    ruleCategories: CATEGORIES,
  });
  render(<RulesSection />);
  expect(screen.getByText("Other")).toBeInTheDocument();
  expect(screen.getByText("Misc rule")).toBeInTheDocument();
});

it("shows no description paragraph when a rule has none", () => {
  mockedUseOrgDefaults.mockReturnValue({
    permissionOptions: [TICKET_UPDATE],
    ruleCategories: CATEGORIES,
  });
  render(<RulesSection />);
  expect(screen.getByText("Update tickets")).toBeInTheDocument();
  expect(screen.queryByText("Can view tickets")).toBeNull();
});
