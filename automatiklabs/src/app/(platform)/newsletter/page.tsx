import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getNewsletters } from "@/features/newsletter/actions/get-newsletters";
import { NewsletterArchive } from "@/features/newsletter/components/newsletter-archive";
import { SubscribeForm } from "@/features/newsletter/components/subscribe-form";

export default async function NewsletterPage() {
  const newsletters = await getNewsletters();

  return (
    <>
      <Topbar title="Newsletter" />

      <div className="w-full space-y-8 py-5">
        <Breadcrumb items={[{ label: "newsletter" }]} />

        {/* Subscribe section */}
        <div className="rounded-[2px] border-2 border-border bg-bg-raised p-5">
          <div className="space-y-3">
            <h2 className="font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
              Inscreva-se na newsletter
            </h2>
            <p className="text-[13px] text-text-2">
              Receba as novidades da AutomatikClub diretamente no seu email.
              Conteudo sobre IA, automacao, e monetizacao digital.
            </p>
            <div className="max-w-[480px]">
              <SubscribeForm />
            </div>
          </div>
        </div>

        {/* Archive */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
              Arquivo
            </h2>
            <p className="text-[13px] text-text-2">
              Edicoes anteriores da newsletter.
            </p>
          </div>

          <NewsletterArchive newsletters={newsletters} />
        </div>
      </div>
    </>
  );
}
