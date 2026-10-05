import type { Metadata } from "next";
import AccountSettingsClient from "@/components/account-settings/account-settings-client";

export const metadata: Metadata = { title: "Settings" };

export default function AccountSettingsPage() {
  return <AccountSettingsClient />;
}
