import { type ReactNode } from 'react';

function normalizeMarkdownBody(content: string, title?: string | null): string {
  const titleNorm = (title ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Gövdeye sızmış H1 / başlık tekrarını gizle — ham "# Başlık" kullanıcıya gösterilmez
    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      const heading = h1Match[1]!.trim().toLowerCase().replace(/\s+/g, ' ');
      if (!titleNorm || heading === titleNorm || heading.length < 120) {
        continue;
      }
    }
    out.push(line);
  }

  return out.join('\n').trim();
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // [label](https://...) — temel markdown link
  const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    nodes.push(
      <a
        key={`link-${key++}`}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[var(--bf-accent-ink)] underline underline-offset-2"
      >
        {match[1]}
      </a>
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes.length > 0 ? nodes : [text];
}

type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

function parseBlocks(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.replace(/^##\s+/, '') });
      i += 1;
      continue;
    }

    // Tek # satırları normalize aşamasında düşmüş olmalı; kalırsa paragraf metni olarak temizle
    if (/^#\s+/.test(trimmed)) {
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const itemLine = (lines[i] ?? '').trim();
        if (!/^[-*]\s+/.test(itemLine)) break;
        items.push(itemLine.replace(/^[-*]\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const itemLine = (lines[i] ?? '').trim();
        if (!/^\d+\.\s+/.test(itemLine)) break;
        items.push(itemLine.replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    const para: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = (lines[i] ?? '').trim();
      if (
        !next ||
        next.startsWith('## ') ||
        next.startsWith('### ') ||
        /^#\s+/.test(next) ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next)
      ) {
        break;
      }
      para.push(next);
      i += 1;
    }
    blocks.push({ type: 'p', text: para.join(' ') });
  }

  return blocks;
}

export function FeedMarkdown({
  content,
  title,
  afterFirstH2,
  beforeEnd
}: {
  content: string;
  title?: string | null;
  /** İlk H2’den hemen sonra enjekte (ör. galeri dilimi) */
  afterFirstH2?: ReactNode;
  /** Son bloktan önce enjekte */
  beforeEnd?: ReactNode;
}) {
  const normalized = normalizeMarkdownBody(content, title);
  if (!normalized) {
    if (afterFirstH2 || beforeEnd) {
      return (
        <div className="prose-feed max-w-none">
          {afterFirstH2}
          {beforeEnd}
        </div>
      );
    }
    return null;
  }

  const blocks = parseBlocks(normalized);
  let insertedAfterH2 = false;
  const firstH2Index = blocks.findIndex((b) => b.type === 'h2');
  const firstParagraphIndex = blocks.findIndex((b) => b.type === 'p');
  // Açılış paragrafı (ilk H2 öncesi) — dergi lead; özet yoksa daha belirgin
  const leadParagraphIndex =
    firstParagraphIndex >= 0 && (firstH2Index < 0 || firstParagraphIndex < firstH2Index)
      ? firstParagraphIndex
      : -1;

  return (
    <div className="prose-feed max-w-none">
      {blocks.map((block, i) => {
        const nodes: ReactNode[] = [];

        if (block.type === 'h2') {
          nodes.push(
            <h2 key={`h2-${i}`} className="mt-8 text-xl font-bold tracking-tight text-foreground">
              {renderInline(block.text)}
            </h2>
          );
        } else if (block.type === 'h3') {
          nodes.push(
            <h3 key={`h3-${i}`} className="mt-6 text-lg font-semibold text-foreground">
              {renderInline(block.text)}
            </h3>
          );
        } else if (block.type === 'ul') {
          nodes.push(
            <ul
              key={`ul-${i}`}
              className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground"
            >
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        } else if (block.type === 'ol') {
          nodes.push(
            <ol
              key={`ol-${i}`}
              className="mt-4 list-decimal space-y-2 pl-5 text-base leading-relaxed text-muted-foreground"
            >
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        } else {
          const isLead = i === leadParagraphIndex;
          nodes.push(
            <p
              key={`p-${i}`}
              className={
                isLead
                  ? 'mt-6 max-w-3xl text-lg leading-[1.7] text-muted-foreground md:text-xl md:leading-[1.65]'
                  : 'mt-4 text-base leading-relaxed text-muted-foreground'
              }
            >
              {renderInline(block.text)}
            </p>
          );
        }

        // İlk H2 bloğunun hemen ardından galeri / callout
        if (
          afterFirstH2 &&
          !insertedAfterH2 &&
          firstH2Index >= 0 &&
          i === firstH2Index
        ) {
          insertedAfterH2 = true;
          nodes.push(<div key="after-first-h2">{afterFirstH2}</div>);
        }

        return nodes;
      })}
      {!insertedAfterH2 && afterFirstH2 ? <div key="after-h2-fallback">{afterFirstH2}</div> : null}
      {beforeEnd}
    </div>
  );
}
