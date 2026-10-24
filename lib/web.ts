// Best-effort page fetching for brand research. Social networks often hide
// content behind logins, so screenshots remain the reliable source for them.

function normalizeUrl(url: string) {
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function decode(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function meta(html: string, name: string) {
  const a = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"));
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i"));
  return decode((a?.[1] ?? b?.[1] ?? "").trim());
}

export async function fetchPage(url: string, maxChars = 8000): Promise<string> {
  const res = await fetch(normalizeUrl(url), {
    signal: AbortSignal.timeout(12000),
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = (await res.text()).slice(0, 800_000);

  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "");
  const description = meta(html, "description") || meta(html, "og:description");
  const body = decode(
    html
      .replace(/<(script|style|noscript|svg|iframe|template)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>|<\/(p|div|h\d|li|section|article|header|footer|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  return [title && `Title: ${title}`, description && `Description: ${description}`, `Content:\n${body}`]
    .filter(Boolean)
    .join("\n")
    .slice(0, maxChars);
}
