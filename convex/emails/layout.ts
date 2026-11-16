// Shared layout for every email the app sends ("Poster" design).
//
// Emails are described as a list of blocks, and each block renders to both HTML and
// plain text, so the two versions never drift apart. The HTML is table-based with
// inline styles because Gmail strips <link> tags, ignores web fonts and Outlook ignores
// most CSS on <div>. Every font stack falls back to Georgia or Helvetica, which is
// what most players (Gmail) will actually see.

export const SITE_URL = "https://www.generalsonline.app";

const BRAND = {
  name: "Games of the Generals",
  logoUrl: `${SITE_URL}/icons/icon-192.png`,
};

const C = {
  page: "#0b0b0d",
  tile: "#141417",
  rule: "#2a2722",
  text: "#e9e6df",
  heading: "#f7f1e3",
  label: "#a29d92",
  brass: "#d9a441",
  brassText: "#17110a",
  danger: "#f08a7e",
};

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export type Block =
  /** `accent` goes on its own line in brass italic. */
  | { kind: "heading"; text: string; accent?: string }
  | { kind: "paragraph"; text: string }
  | { kind: "button"; label: string; href: string }
  | { kind: "code"; code: string; caption: string }
  | { kind: "details"; rows: { label: string; value: string; tone?: "danger" | "brass" }[] }
  | { kind: "quote"; label: string; text: string }
  | { kind: "stats"; items: { label: string; value: string }[] }
  | { kind: "note"; text: string }
  | { kind: "signature"; lines: string[] };

export type EmailContent = {
  subject: string;
  /** The line inbox apps show next to the subject. */
  preheader: string;
  /** Full-width art at the top. The image should fade into the page colour at its bottom edge. */
  hero?: { src: string; alt: string };
  blocks: Block[];
  /** Why this person got the email, shown in the footer. */
  reason: string;
};

export type RenderedEmail = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Paragraph text is plain text with **bold** spans. Everything is escaped first.
function inlineHtml(text: string): string {
  return escapeHtml(text).replace(
    /\*\*(.+?)\*\*/g,
    `<strong style="color:${C.heading};font-weight:600;">$1</strong>`,
  );
}

function inlineText(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}

const row = (inner: string, padding: string) =>
  `<tr><td class="px" align="center" style="padding:${padding};">${inner}</td></tr>`;

const isNumber = (value: string) => /^[\d,.]+$/.test(value);

function blockHtml(block: Block, index: number): string {
  switch (block.kind) {
    case "heading": {
      const accent = block.accent
        ? `<br><span style="font-style:italic;font-weight:600;color:${C.brass};">${escapeHtml(block.accent)}</span>`
        : "";
      return row(
        `<h1 class="h" style="margin:0;font-family:${SERIF};font-size:48px;line-height:54px;font-weight:800;letter-spacing:-0.5px;color:${C.heading};">${escapeHtml(block.text)}${accent}</h1>`,
        index === 0 ? "0 48px 24px" : "16px 48px 24px",
      );
    }
    case "paragraph":
      return row(
        `<p style="margin:0;font-family:${SANS};font-size:17px;line-height:28px;color:${C.text};">${inlineHtml(block.text)}</p>`,
        "0 48px 18px",
      );
    case "button":
      return row(
        `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" bgcolor="${C.brass}" style="border-radius:6px;">
            <a href="${escapeHtml(block.href)}" target="_blank" style="display:inline-block;padding:16px 40px;font-family:${SANS};font-size:16px;line-height:20px;font-weight:600;color:${C.brassText};text-decoration:none;border-radius:6px;">${escapeHtml(block.label)}</a>
          </td></tr></table>`,
        "18px 48px 30px",
      );
    case "code": {
      // One tile per character, like pieces on the board. Easier to read and type than one long string.
      const tiles = block.code
        .split("")
        .map(
          (ch) => `<td style="padding:0 3px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td class="dg" width="50" height="62" align="center" valign="middle" bgcolor="${C.tile}" style="width:50px;height:62px;border:1px solid ${C.rule};border-radius:6px;font-family:${SANS};font-size:30px;line-height:30px;font-weight:600;color:${C.heading};">${escapeHtml(ch)}</td>
          </tr></table></td>`,
        )
        .join("");
      return row(
        `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr>${tiles}</tr></table>
         <p style="margin:14px 0 0;font-family:${SANS};font-size:14px;line-height:20px;color:${C.label};">${escapeHtml(block.caption)}</p>`,
        "14px 40px 30px",
      );
    }
    case "details": {
      const rows = block.rows
        .map((r, i) => {
          const color = r.tone === "danger" ? C.danger : r.tone === "brass" ? C.brass : C.heading;
          const top = i === 0 ? "none" : `1px solid ${C.rule}`;
          return `<tr>
            <td align="left" style="padding:14px 0;border-top:${top};font-family:${SANS};font-size:15px;line-height:22px;color:${C.label};">${escapeHtml(r.label)}</td>
            <td align="right" style="padding:14px 0;border-top:${top};font-family:${SANS};font-size:15px;line-height:22px;font-weight:600;color:${color};">${escapeHtml(r.value)}</td>
          </tr>`;
        })
        .join("");
      return row(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.rule};border-bottom:1px solid ${C.rule};">${rows}</table>`,
        "8px 48px 26px",
      );
    }
    case "quote":
      return row(
        `<p style="margin:0;font-family:${SANS};font-size:13px;line-height:18px;color:${C.label};">${escapeHtml(block.label)}</p>
         <p style="margin:6px 0 0;font-family:${SERIF};font-style:italic;font-size:19px;line-height:28px;color:${C.heading};">“${escapeHtml(block.text)}”</p>`,
        "0 48px 26px",
      );
    case "stats": {
      const width = Math.floor(100 / block.items.length);
      const cells = block.items
        .map(
          (s, i) => `<td width="${width}%" align="center" style="padding:4px 6px;${i > 0 ? `border-left:1px solid ${C.rule};` : ""}">
            <div class="sv" style="font-family:${isNumber(s.value) ? SANS : SERIF};font-size:28px;line-height:34px;font-weight:700;color:${C.heading};">${escapeHtml(s.value)}</div>
            <div style="margin-top:4px;font-family:${SANS};font-size:13px;line-height:18px;color:${C.label};">${escapeHtml(s.label)}</div>
          </td>`,
        )
        .join("");
      return row(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.rule};border-bottom:1px solid ${C.rule};"><tr><td style="padding:22px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>
        </td></tr></table>`,
        "14px 48px 10px",
      );
    }
    case "note":
      return row(
        `<p style="margin:0;font-family:${SANS};font-size:14px;line-height:22px;color:${C.label};">${inlineHtml(block.text)}</p>`,
        "0 48px 18px",
      );
    case "signature":
      return row(
        `<p style="margin:0;font-family:${SERIF};font-style:italic;font-size:20px;line-height:30px;color:${C.text};">${block.lines.map(escapeHtml).join("<br>")}</p>`,
        "24px 48px 0",
      );
  }
}

function blockText(block: Block): string {
  switch (block.kind) {
    case "heading":
      return block.accent ? `${block.text} ${block.accent}` : block.text;
    case "paragraph":
    case "note":
      return inlineText(block.text);
    case "button":
      return `${block.label}: ${block.href}`;
    case "code":
      return `${block.code}\n${block.caption}`;
    case "details":
      return block.rows.map((r) => `${r.label}: ${r.value}`).join("\n");
    case "quote":
      return `${block.label}: ${block.text}`;
    case "stats":
      return block.items.map((s) => `${s.label}: ${s.value}`).join("\n");
    case "signature":
      return block.lines.join("\n");
  }
}

export function renderEmail(content: EmailContent): RenderedEmail {
  const { subject, preheader, hero, blocks, reason } = content;

  // With art, the art is the header. Without it, the emblem leads.
  const top = hero
    ? `<tr><td style="padding:0;font-size:0;line-height:0;">
        <img src="${escapeHtml(hero.src)}" width="600" alt="${escapeHtml(hero.alt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
      </td></tr>`
    : `<tr><td align="center" style="padding:56px 48px 32px;">
        <a href="${SITE_URL}" target="_blank"><img src="${BRAND.logoUrl}" width="56" height="56" alt="${BRAND.name}" style="display:block;border:0;border-radius:10px;" /></a>
      </td></tr>`;

  // Pads the inbox preview so the body text doesn't leak in after the preheader.
  const preheaderPad = "&#847;&zwnj;&nbsp;".repeat(60);

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(subject)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,700;0,800;1,600&display=swap');
  :root { color-scheme: dark; supported-color-schemes: dark; }
  body { margin: 0; padding: 0; width: 100% !important; background: ${C.page}; }
  a { color: ${C.brass}; }
  @media (max-width: 480px) {
    .px { padding-left: 24px !important; padding-right: 24px !important; }
    .h { font-size: 36px !important; line-height: 42px !important; }
    .sv { font-size: 21px !important; line-height: 28px !important; }
    .dg { width: 40px !important; height: 52px !important; font-size: 24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}${preheaderPad}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background-color:${C.page};">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
    ${top}
    ${blocks.map(blockHtml).join("\n")}
    <tr><td class="px" align="center" style="padding:48px 48px 56px;">
      <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:40px;height:1px;background:${C.rule};font-size:0;line-height:0;">&nbsp;</td></tr></table>
      <img src="${BRAND.logoUrl}" width="28" height="28" alt="" style="display:block;margin:24px auto 12px;border:0;border-radius:6px;" />
      <p style="margin:0 0 6px;font-family:${SANS};font-size:13px;line-height:20px;color:${C.label};">${escapeHtml(reason)}</p>
      <p style="margin:0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.label};">${BRAND.name} · <a href="${SITE_URL}" target="_blank" style="color:${C.label};text-decoration:underline;">generalsonline.app</a></p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    BRAND.name,
    "",
    ...blocks.map(blockText).flatMap((t) => [t, ""]),
    "---",
    reason,
    `${BRAND.name} · ${SITE_URL}`,
  ].join("\n");

  return { subject, preheader, html, text };
}
