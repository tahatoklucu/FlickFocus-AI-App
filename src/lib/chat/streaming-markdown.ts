/**
 * Trims trailing partial markdown syntax so mid-stream tokens do not break layout.
 */
export function prepareStreamingMarkdown(text: string, isStreaming: boolean): string {
  if (!isStreaming || !text) {
    return text;
  }

  let safe = text;

  const fenceMatches = safe.match(/```/g);
  if (fenceMatches && fenceMatches.length % 2 === 1) {
    safe = safe.slice(0, safe.lastIndexOf("```"));
  }

  const inlineCodeMatches = safe.match(/`/g);
  if (inlineCodeMatches && inlineCodeMatches.length % 2 === 1) {
    safe = safe.slice(0, safe.lastIndexOf("`"));
  }

  safe = safe.replace(/(\*{1,3}|_{1,3})(?=\s*$)/u, "");
  safe = safe.replace(/(\*{1,3}|_{1,3})[^\s*_`[\]()]+$/u, (match) =>
    match.replace(/(\*{1,3}|_{1,3})$/u, ""),
  );
  safe = safe.replace(/!?\[[^\]]*(\]\([^\)]*)?$/u, "");
  safe = safe.replace(/^#{1,6}\s[^\n]*$/u, (line) => line.replace(/^#{1,6}\s/u, ""));

  return safe;
}

type MarkdownBlock =
  | { type: "paragraph"; text: string }
  | { type: "code"; language: string; text: string };

function parseMarkdownBlocks(text: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const parts = text.split(/(```[\s\S]*?```)/g);

  for (const part of parts) {
    if (!part) {
      continue;
    }

    if (part.startsWith("```")) {
      const match = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
      if (match) {
        blocks.push({
          type: "code",
          language: match[1] ?? "",
          text: match[2] ?? "",
        });
        continue;
      }
    }

    blocks.push({ type: "paragraph", text: part });
  }

  return blocks;
}

function renderInlineMarkdown(text: string): string {
  const escaped = escapeHtml(text);

  return escaped
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>");
}

export function renderStreamingMarkdownHtml(
  text: string,
  isStreaming: boolean,
): string {
  const safeText = prepareStreamingMarkdown(text, isStreaming);
  const blocks = parseMarkdownBlocks(safeText);

  return blocks
    .map((block) => {
      if (block.type === "code") {
        const lang = block.language
          ? ` class="language-${block.language}"`
          : "";
        return `<pre><code${lang}>${escapeHtml(block.text)}</code></pre>`;
      }

      return block.text
        .split(/\n{2,}/)
        .map((paragraph) => {
          const trimmed = paragraph.trim();
          if (!trimmed) {
            return "";
          }

          if (/^#{1,6}\s/.test(trimmed)) {
            const content = trimmed.replace(/^#{1,6}\s/u, "");
            return `<p><strong>${renderInlineMarkdown(content)}</strong></p>`;
          }

          const lines = trimmed
            .split("\n")
            .map((line) => renderInlineMarkdown(line))
            .join("<br />");

          return `<p>${lines}</p>`;
        })
        .join("");
    })
    .join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
