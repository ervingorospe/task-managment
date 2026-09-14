"use client";

import { AccountTypeGuard } from "@/components/auth/account-type.guard";
import Card from "@/components/ui/card";
import { ACCOUNT_TYPE } from "@/lib/constants/accoun-type.constant";
import { useOrganizationDefaults } from "@/providers/organization-defaults.provider";

export default function RulesSection() {
  const { permissionOptions, ruleCategories } = useOrganizationDefaults();

  const categoryMap = new Map(
    ruleCategories.map((category) => [category.id, category.name]),
  );

  const grouped = permissionOptions.reduce<
    Record<number, typeof permissionOptions>
  >((acc, rule) => {
    (acc[rule.categoryId] ??= []).push(rule);

    return acc;
  }, {});

  return (
    <AccountTypeGuard accountType={ACCOUNT_TYPE.OWNER}>
      <Card
        title="Rules"
        subtitle="The full set of permissions available in the system. Not editable here."
      >
        <div className="space-y-6">
          {Object.entries(grouped).map(([categoryId, rules]) => {
            const categoryName = categoryMap.get(Number(categoryId)) ?? "Other";

            return (
              <section key={categoryId}>
                <h3 className="mb-3 text-sm font-semibold text-ink">
                  {categoryName}
                </h3>

                <div className="divide-y divide-line rounded border border-line">
                  {rules.map((rule) => (
                    <div key={rule.id} className="px-4 py-3">
                      <p className="text-sm font-medium text-ink">
                        {rule.name}
                      </p>

                      {rule.desc && (
                        <p className="mt-1 text-sm text-ink-muted">
                          {rule.desc}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Card>
    </AccountTypeGuard>
  );
}
