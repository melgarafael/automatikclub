import { Breadcrumb } from "@/shared/components/breadcrumb";
import { UserTable } from "@/features/admin/components/user-table";
import { getAdminUsers } from "@/features/admin/actions/manage-users";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Usuarios" },
        ]}
      />

      <h1 className="mb-6 font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
        Gerenciamento de Usuarios
      </h1>

      <UserTable users={users} />
    </div>
  );
}
