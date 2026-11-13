/**
 * Helpers for the rich-text content produced by the post editor.
 *
 * Content is stored as HTML. Rendering it back into the page requires
 * sanitizing first so stored markup cannot inject scripts or event handlers.
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "code",
  "pre",
  "span",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
};

/** Strip every tag and attribute not on the allow-list. */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");

  for (const el of Array.from(doc.body.querySelectorAll("*"))) {
    const tag = el.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      el.replaceWith(...Array.from(el.childNodes));
      continue;
    }
    const allowed = ALLOWED_ATTRS[tag] ?? new Set<string>();
    for (const attr of Array.from(el.attributes)) {
      if (!allowed.has(attr.name.toLowerCase())) {
        el.removeAttribute(attr.name);
      }
    }
    if (tag === "a") {
      const href = el.getAttribute("href") ?? "";
      if (!/^(https?:|mailto:|\/)/i.test(href)) {
        el.removeAttribute("href");
      } else {
        el.setAttribute("rel", "noopener noreferrer");
      }
    }
  }

  return doc.body.innerHTML;
}

/** Plain-text excerpt of rich content, for cards and previews. */
export function htmlToExcerpt(html: string, maxLength = 160): string {
  if (typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

/** True when the content has no visible text. */
export function isHtmlEmpty(html: string): boolean {
  return htmlToExcerpt(html, Number.MAX_SAFE_INTEGER).length === 0;
}
