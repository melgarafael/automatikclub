import DOMPurify from 'isomorphic-dompurify';

// Renders admin-authored HTML content from free_contents.content_data.htmlContent.
// Content source is trusted (only admins write via SUPABASE_SERVICE_ROLE_KEY)
// BUT we still sanitize as defense-in-depth.

interface HtmlBlockProps {
  html: string;
}

export function HtmlBlock({ html }: HtmlBlockProps) {
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
  });
  return (
    <div
      className="free-content-html mt-6"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
