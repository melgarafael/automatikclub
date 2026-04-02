import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { Breadcrumb } from "@/shared/components/breadcrumb";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Role guard: redirect non-admins
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/feed");
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-[220px] shrink-0 overflow-y-auto border-r border-border bg-bg-inset p-4">
        <AdminSidebar />
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
