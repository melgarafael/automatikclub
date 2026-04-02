import { Breadcrumb } from "@/shared/components/breadcrumb";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { NewsletterEditor } from "@/features/newsletter/components/newsletter-editor";
import { createClient } from "@/shared/lib/supabase/server";
import { NewsletterActions } from "./newsletter-actions";

export default async function AdminNewsletterPage() {
  const supabase = await createClient();

  const { data: newsletters } = await supabase
    .from("newsletters")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const drafts = (newsletters ?? []).filter((n) => n.status === "draft");
  const sent = (newsletters ?? []).filter((n) => n.status === "sent");

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Newsletter" },
        ]}
      />

      <h1 className="mb-6 font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
        Gerenciamento de Newsletters
      </h1>

      {/* Newsletter lists */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Drafts */}
        <div>
          <h2 className="mb-3 font-display text-[16px] font-bold text-text-1">
            Rascunhos ({drafts.length})
          </h2>
          <div className="space-y-2">
            {drafts.length === 0 ? (
              <p className="rounded-[2px] border-2 border-border bg-bg-inset p-4 text-center font-mono text-[12px] text-text-3">
                Nenhum rascunho
              </p>
            ) : (
              drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between rounded-[2px] border-2 border-border bg-bg-raised p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[13px] font-semibold text-text-1">
                      {draft.title}
                    </p>
                    <p className="font-mono text-[11px] text-text-3">
                      {new Date(draft.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">rascunho</Badge>
                    <NewsletterActions id={draft.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sent */}
        <div>
          <h2 className="mb-3 font-display text-[16px] font-bold text-text-1">
            Enviadas ({sent.length})
          </h2>
          <div className="space-y-2">
            {sent.length === 0 ? (
              <p className="rounded-[2px] border-2 border-border bg-bg-inset p-4 text-center font-mono text-[12px] text-text-3">
                Nenhuma newsletter enviada
              </p>
            ) : (
              sent.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-[2px] border-2 border-border bg-bg-raised p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[13px] font-semibold text-text-1">
                      {item.title}
                    </p>
                    <p className="font-mono text-[11px] text-text-3">
                      Enviada em{" "}
                      {item.sent_at
                        ? new Date(item.sent_at).toLocaleDateString("pt-BR")
                        : "--"}
                    </p>
                  </div>
                  <Badge variant="mod">enviada</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create new */}
      <div className="mx-auto max-w-[800px]">
        <h2 className="mb-4 font-display text-[16px] font-bold text-text-1">
          Criar nova newsletter
        </h2>
        <NewsletterEditor />
      </div>
    </div>
  );
}
