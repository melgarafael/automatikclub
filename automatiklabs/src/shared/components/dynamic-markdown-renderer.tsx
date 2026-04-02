import dynamic from "next/dynamic";
import { LoadingSkeleton } from "./loading-skeleton";

/**
 * Dynamically imported MarkdownRenderer to reduce initial bundle size.
 * Use this instead of importing MarkdownRenderer directly in pages
 * where the markdown content is not above-the-fold.
 */
export const DynamicMarkdownRenderer = dynamic(
  () => import("./markdown-renderer").then((mod) => mod.MarkdownRenderer),
  {
    loading: () => <LoadingSkeleton variant="inline" />,
    ssr: true,
  }
);

export default DynamicMarkdownRenderer;
