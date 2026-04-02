import { notFound } from "next/navigation";
import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getNewsletterBySlug } from "@/features/newsletter/actions/get-newsletters";

export default async function NewsletterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const newsletter = await getNewsletterBySlug(slug);

  if (!newsletter) {
    notFound();
  }

  const sentDate = newsletter.sent_at
    ? new Date(newsletter.sent_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  // Strip script tags as basic server-side sanitization.
  // Content is admin-authored and stored in DB via RLS-protected insert.
  // For production, integrate DOMPurify or similar server-side sanitizer.
  const sanitizedHtml = newsletter.content_html
    ? newsletter.content_html.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        ""
      )
    : null;

  return (
    <>
      <Topbar title="Newsletter" />

      <div className="w-full space-y-6 py-5">
        <Breadcrumb
          items={[
            { label: "newsletter", href: "/newsletter" },
            { label: newsletter.title },
          ]}
        />

        <article className="mx-auto max-w-[680px]">
          {/* Header */}
          <div className="space-y-3 border-b-2 border-border pb-6">
            <h1 className="font-display text-[24px] font-bold tracking-[-0.03em] text-text-1">
              {newsletter.title}
            </h1>
            <div className="flex items-center gap-3">
              {sentDate && (
                <span className="font-mono text-[12px] text-text-3">
                  {sentDate}
                </span>
              )}
              {newsletter.author_name && (
                <>
                  <span className="text-text-3">|</span>
                  <span className="font-mono text-[12px] text-text-3">
                    por {newsletter.author_name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Content — admin-authored HTML, script-stripped */}
          {sanitizedHtml ? (
            <div className="mt-6 max-w-none text-[14px] leading-[1.7] text-text-1 [&_a]:text-blue [&_a]:underline [&_h1]:mb-4 [&_h1]:font-display [&_h1]:text-[22px] [&_h1]:font-bold [&_h1]:tracking-[-0.03em] [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:tracking-[-0.03em] [&_h3]:mb-2 [&_h3]:font-display [&_h3]:text-[16px] [&_h3]:font-semibold [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_code]:rounded-[2px] [&_code]:bg-bg-inset [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_blockquote]:border-l-2 [&_blockquote]:border-blue [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-2 [&_img]:max-w-full [&_img]:rounded-[2px]">
              {sanitizedHtml}
            </div>
          ) : (
            <p className="mt-6 text-[14px] text-text-3">
              Conteudo nao disponivel.
            </p>
          )}

          {/* Back link */}
          <div className="mt-10 border-t-2 border-border pt-6">
            <a
              href="/newsletter"
              className="font-mono text-[13px] text-blue hover:underline"
            >
              Voltar ao arquivo
            </a>
          </div>
        </article>
      </div>
    </>
  );
}
