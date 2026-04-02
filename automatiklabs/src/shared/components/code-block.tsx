"use client";

import { useState } from "react";

interface CodeBlockProps {
  language?: string;
  children: string;
  className?: string;
}

export function CodeBlock({
  language = "text",
  children,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`my-3 overflow-hidden rounded-[2px] border-2 border-border bg-bg-inset ${className ?? ""}`}
    >
      {/* Header bar */}
      <div className="flex items-center gap-[6px] border-b border-border bg-bg px-3 py-[6px] font-mono text-[11px] text-text-3">
        <span className="text-blue">{language}</span>
        <button
          onClick={handleCopy}
          aria-label={copied ? "Codigo copiado" : "Copiar codigo"}
          className="ml-auto cursor-pointer text-text-3 transition-colors duration-[80ms] hover:text-text-1"
        >
          {copied ? "copiado!" : "copiar"}
        </button>
      </div>

      {/* Code content */}
      <pre className="overflow-x-auto p-3 font-mono text-[13px] leading-[1.5] text-text-2">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default CodeBlock;
