import dynamic from "next/dynamic";
import { LoadingSkeleton } from "./loading-skeleton";

/**
 * Dynamically imported CodeBlock to reduce initial bundle size.
 * Use this instead of importing CodeBlock directly in pages
 * where code blocks are below-the-fold or conditionally rendered.
 */
export const DynamicCodeBlock = dynamic(
  () => import("./code-block").then((mod) => mod.CodeBlock),
  {
    loading: () => <LoadingSkeleton variant="card" />,
    ssr: true,
  }
);

export default DynamicCodeBlock;
