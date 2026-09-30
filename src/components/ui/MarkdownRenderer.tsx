'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl bg-black/60 border border-line overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-2/60 border-b border-line text-muted">
        <span>{lang || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-neon-green" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-fg/90 scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`prose prose-invert max-w-[68ch] font-sans text-fg/85 text-sm sm:text-base leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const hasLang = !firstLine.includes(' ') && firstLine.length > 0;
          const lang = hasLang ? firstLine : undefined;
          const code = (hasLang ? lines.slice(1) : lines).join('\n');
          return <CodeBlock key={index} code={code} lang={lang} />;
        }

        // Render standard markdown lines
        const paragraphs = part.split(/\n\s*\n/);
        return (
          <React.Fragment key={index}>
            {paragraphs.map((para, pIdx) => {
              const trimmed = para.trim();
              if (!trimmed) return null;

              // Heading 1
              if (trimmed.startsWith('# ')) {
                return (
                  <h2 key={pIdx} className="text-xl sm:text-2xl font-sans font-semibold text-white mt-6 mb-3">
                    {trimmed.slice(2)}
                  </h2>
                );
              }
              // Heading 2
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={pIdx} className="text-lg sm:text-xl font-sans font-semibold text-white mt-5 mb-2.5">
                    {trimmed.slice(3)}
                  </h3>
                );
              }
              // Heading 3
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={pIdx} className="text-base sm:text-lg font-sans font-medium text-white mt-4 mb-2">
                    {trimmed.slice(4)}
                  </h4>
                );
              }

              // Bullet list
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const items = trimmed.split('\n').filter((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
                return (
                  <ul key={pIdx} className="my-3 space-y-1.5 list-disc list-inside text-fg/80">
                    {items.map((item, iIdx) => (
                      <li key={iIdx}>
                        {formatInline(item.replace(/^[-*]\s+/, ''))}
                      </li>
                    ))}
                  </ul>
                );
              }

              // Numbered list
              if (/^\d+\.\s/.test(trimmed)) {
                const items = trimmed.split('\n').filter((l) => /^\d+\.\s/.test(l.trim()));
                return (
                  <ol key={pIdx} className="my-3 space-y-1.5 list-decimal list-inside text-fg/80">
                    {items.map((item, iIdx) => (
                      <li key={iIdx}>
                        {formatInline(item.replace(/^\d+\.\s+/, ''))}
                      </li>
                    ))}
                  </ol>
                );
              }

              return (
                <p key={pIdx} className="my-3 text-fg/80 leading-relaxed">
                  {formatInline(trimmed)}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  // Simple regex parser for `code`, **bold**, *italic*, and [link](url)
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);

  return tokens.map((token, i) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-surface-2 border border-line font-mono text-xs text-white">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return (
        <em key={i} className="italic text-fg/90">
          {token.slice(1, -1)}
        </em>
      );
    }
    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-red hover:underline"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return token;
  });
}
