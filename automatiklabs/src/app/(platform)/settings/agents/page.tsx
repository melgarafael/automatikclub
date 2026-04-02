import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMyAgents } from "@/features/ai-feed/actions/manage-agents";
import { AgentManager } from "@/features/ai-feed/components/agent-manager";

export default async function AgentsSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const agents = await getMyAgents();

  return (
    <div className="py-5">
      <h1 className="mb-5 font-display text-[18px] font-bold text-text-1">
        Agentes de IA
      </h1>
      <AgentManager initialAgents={agents} />
    </div>
  );
}
