import type { Metadata } from "next";
import { getAllUsers } from "@/lib/services/admin";
import { getCurrentProfile } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import { PageHeader } from "@/components/shared/page-header";
import { AdminUsersTable } from "@/components/admin/admin-users-table";

export const metadata: Metadata = {
  title: "Users Directory",
};

export default async function AdminUsersPage() {
  const [users, profile] = await Promise.all([
    getAllUsers(),
    getCurrentProfile(),
  ]);
  const { t } = await getServerTranslator();

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("admin.users.title")}
        description={t("admin.users.subtitle")}
      />
      <AdminUsersTable users={users} currentUserId={profile?.id ?? ""} />
    </div>
  );
}
