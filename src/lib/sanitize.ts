/**
 * Мінімальна санітизація HTML для SEO-текстів з адмінки.
 * Не є повноцінним HTML sanitizer-ом як DOMPurify, але:
 * - прибирає <script>/<iframe>/<style>/<base>
 * - прибирає inline on* handlers
 * - нейтралізує javascript: у href/src
 */

export function sanitizeHtml(input: string): string {
  let s = String(input || "");

  // remove dangerous tags
  s = s.replace(/<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi, "");
  s = s.replace(/<\s*iframe[\s\S]*?>[\s\S]*?<\s*\/\s*iframe\s*>/gi, "");
  s = s.replace(/<\s*style[\s\S]*?>[\s\S]*?<\s*\/\s*style\s*>/gi, "");
  s = s.replace(/<\s*base[^>]*>/gi, "");

  // strip event handlers: onclick=..., onload=...
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // neutralize javascript: URLs
  s = s.replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, " $1=\"#\"");
  s = s.replace(/\s(href|src)\s*=\s*javascript:[^\s>]+/gi, " $1=\"#\"");

  return s;
}

export function sanitizeCss(input: string): string {
  let s = String(input || "");
  // prevent breaking out of <style>
  s = s.replace(/<\s*\/\s*style/gi, "<\\/style");
  return s;
}

/**
 * Naive scoping: prefixes top-level selectors with scope.
 * Works for common "selector { ... }" rules. @media blocks are kept as-is.
 */
export function scopeCss(css: string, scope: string): string {
  const cleaned = sanitizeCss(css);
  return cleaned.replace(/(^|})(\s*)([^@}{][^{]*)\{/g, (m, pre, ws, selector) => {
    const sel = String(selector || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => (p.startsWith(scope) ? p : `${scope} ${p}`))
      .join(", ");
    return `${pre}${ws}${sel}{`;
  });
}
