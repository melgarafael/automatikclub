"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { CodeBlock } from "./code-block";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-5 font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 font-display text-[15px] font-semibold tracking-[-0.03em] text-text-1">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-[14px] leading-[1.65] text-text-2">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-blue underline-offset-2 hover:underline"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 ml-5 list-disc space-y-1 text-[14px] text-text-2">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 ml-5 list-decimal space-y-1 text-[14px] text-text-2">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-[1.6]">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-[3px] border-blue pl-4 text-[14px] italic text-text-2">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    const isBlock = match || (typeof children === "string" && children.includes("\n"));

    if (isBlock) {
      return (
        <CodeBlock language={match?.[1] || "text"}>
          {String(children).replace(/\n$/, "")}
        </CodeBlock>
      );
    }

    return (
      <code
        className="rounded-[2px] border border-border bg-bg-inset px-[5px] py-[1px] font-mono text-[12px] text-cyan"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  hr: () => <hr className="my-6 border-border" />,
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse rounded-[2px] border border-border text-[13px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-border bg-bg-inset">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-text-3">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-t border-border px-3 py-2 text-text-2">
      {children}
    </td>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-text-1">{children}</strong>
  ),
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
