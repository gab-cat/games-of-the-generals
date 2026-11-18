// Shared layout for every email the app sends. It follows the app's Season 3 look
// (DESIGN.md): near-black page, Poppins, warm off-white text, one gold accent,
// flat 8px panels with 1px borders, everything left-aligned under the brand lockup.
//
// Emails are described as a list of blocks, and each block renders to both HTML and
// plain text, so the two versions never drift apart. The HTML is table-based with
// inline styles because Outlook ignores most CSS on <div>. Poppins loads in Apple Mail,
// iOS Mail and Outlook for Mac; Gmail ignores web fonts and shows the system sans
// (Roboto, Helvetica or Arial), which keeps the same weights and layout.

export const SITE_URL = "https://www.generalsonline.app";

const BRAND = {
  name: "Games of the Generals",
  /** The three gold chevrons from the app header (BrandMark), as a 4x PNG. */
  markUrl: `${SITE_URL}/email/mark.png`,
};

// Season 3 tokens from src/index.css, as hex for email clients.
const C = {
  page: "#0b0b0d", // --background
  card: "#111114", // --card
  border: "#242428", // --border
  heading: "#f5f2ec", // --foreground
  text: "#dedbd5", // foreground at about 88%
  label: "#bfbcb6", // foreground at about 75%
  footer: "#9b9893", // foreground at about 60%, footer only
  gold: "#d9a441", // --primary
  goldText: "#17110a", // --primary-foreground
  danger: "#f87171", // red-400
};

const FONT =
  "Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "button"; label: string; href: string }
  | { kind: "code"; code: string; caption: string }
  | { kind: "details"; rows: { label: string; value: string; tone?: "danger" | "gold" }[] }
  | { kind: "quote"; label: string; text: string }
  | { kind: "stats"; items: { label: string; value: string }[] }
  | { kind: "note"; text: string }
  | { kind: "signature"; lines: string[] }
  /** A checklist of things to act on, each with its own link. */
  | {
      kind: "items";
      items: { title: string; tag?: string; meta: string; href: string; linkLabel: string }[];
    };

export type EmailContent = {
  subject: string;
  /** The line inbox apps show next to the subject. */
  preheader: string;
  /** Full-width art under the lockup, 1200px wide. Its bottom edge should fade into the page colour. */
  hero?: { src: string; alt: string };
  blocks: Block[];
  /** Why this person got the email, shown in the footer. */
  reason: string;
  /** One-click unsubscribe link, for announcements only. Shown in the footer. */
  unsubscribeUrl?: string;
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
  `<tr><td class="px" align="left" style="padding:${padding};">${inner}</td></tr>`;

/** A flat 8px panel, like `surface` in the app. */
const panel = (inner: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="background-color:${C.card};border:1px solid ${C.border};border-radius:8px;border-collapse:separate;">${inner}</table>`;

function blockHtml(block: Block, index: number): string {
  switch (block.kind) {
    case "heading":
      return row(
        `<h1 class="h" style="margin:0;font-family:${FONT};font-size:32px;line-height:38px;font-weight:700;letter-spacing:-0.6px;color:${C.heading};">${escapeHtml(block.text)}</h1>`,
        index === 0 ? "8px 40px 14px" : "20px 40px 14px",
      );
    case "paragraph":
      return row(
        `<p style="margin:0;font-family:${FONT};font-size:16px;line-height:26px;color:${C.text};">${inlineHtml(block.text)}</p>`,
        "0 40px 18px",
      );
    case "button":
      return row(
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" bgcolor="${C.gold}" style="border-radius:6px;">
            <a href="${escapeHtml(block.href)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:600;color:${C.goldText};text-decoration:none;border-radius:6px;">${escapeHtml(block.label)}</a>
          </td></tr></table>`,
        "10px 40px 30px",
      );
    case "code": {
      // One tile per character, like pieces on the board. Easier to read and type than one long string.
      const tiles = block.code
        .split("")
        .map(
          (ch, i) => `<td style="padding:0 ${i === block.code.length - 1 ? 0 : 6}px 0 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td class="dg" width="48" height="58" align="center" valign="middle" bgcolor="${C.card}" style="width:48px;height:58px;border:1px solid ${C.border};border-radius:6px;font-family:${FONT};font-size:28px;line-height:28px;font-weight:600;color:${C.heading};">${escapeHtml(ch)}</td>
          </tr></table></td>`,
        )
        .join("");
      return row(
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${tiles}</tr></table>
         <p style="margin:12px 0 0;font-family:${FONT};font-size:14px;line-height:20px;color:${C.label};">${escapeHtml(block.caption)}</p>`,
        "6px 40px 28px",
      );
    }
    case "details": {
      const rows = block.rows
        .map((r, i) => {
          const color = r.tone === "danger" ? C.danger : r.tone === "gold" ? C.gold : C.heading;
          const top = i === 0 ? "none" : `1px solid ${C.border}`;
          return `<tr>
            <td align="left" style="padding:14px 20px;border-top:${top};font-family:${FONT};font-size:15px;line-height:22px;color:${C.label};">${escapeHtml(r.label)}</td>
            <td align="right" style="padding:14px 20px;border-top:${top};font-family:${FONT};font-size:15px;line-height:22px;font-weight:600;color:${color};">${escapeHtml(r.value)}</td>
          </tr>`;
        })
        .join("");
      return row(panel(rows), "6px 40px 24px");
    }
    case "quote":
      // Same as the points in the Season 3 dialog: a gold rule on the left.
      return row(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="border-left:2px solid ${C.gold};padding:2px 0 2px 16px;">
            <p style="margin:0;font-family:${FONT};font-size:15px;line-height:22px;font-weight:600;color:${C.heading};">${escapeHtml(block.label)}</p>
            <p style="margin:2px 0 0;font-family:${FONT};font-size:15px;line-height:24px;color:${C.text};">${escapeHtml(block.text)}</p>
          </td></tr></table>`,
        "0 40px 24px",
      );
    case "stats": {
      const width = Math.floor(100 / block.items.length);
      const cells = block.items
        .map(
          (s, i) => `<td class="sc" width="${width}%" align="left" valign="top" style="padding:16px 20px;${i > 0 ? `border-left:1px solid ${C.border};` : ""}">
            <div style="font-family:${FONT};font-size:13px;line-height:18px;color:${C.label};">${escapeHtml(s.label)}</div>
            <div class="sv" style="margin-top:4px;font-family:${FONT};font-size:24px;line-height:30px;font-weight:700;letter-spacing:-0.3px;color:${C.heading};">${escapeHtml(s.value)}</div>
          </td>`,
        )
        .join("");
      return row(panel(`<tr>${cells}</tr>`), "6px 40px 26px");
    }
    case "note":
      return row(
        `<p style="margin:0;font-family:${FONT};font-size:14px;line-height:22px;color:${C.label};">${inlineHtml(block.text)}</p>`,
        "0 40px 18px",
      );
    case "items": {
      const rows = block.items
        .map((item, i) => {
          const top = i === 0 ? "none" : `1px solid ${C.border}`;
          const tag = item.tag
            ? ` <span style="display:inline-block;margin-left:6px;padding:1px 8px;border:1px solid ${C.gold};border-radius:4px;font-size:12px;line-height:18px;font-weight:600;color:${C.gold};">${escapeHtml(item.tag)}</span>`
            : "";
          return `<tr>
            <td align="left" valign="top" style="padding:14px 20px;border-top:${top};">
              <div style="font-family:${FONT};font-size:15px;line-height:22px;font-weight:600;color:${C.heading};">${escapeHtml(item.title)}${tag}</div>
              <div style="margin-top:2px;font-family:${FONT};font-size:14px;line-height:20px;color:${C.label};">${escapeHtml(item.meta)}</div>
            </td>
            <td align="right" valign="middle" style="padding:14px 20px;border-top:${top};white-space:nowrap;">
              <a href="${escapeHtml(item.href)}" target="_blank" style="font-family:${FONT};font-size:14px;line-height:20px;font-weight:600;color:${C.gold};text-decoration:underline;">${escapeHtml(item.linkLabel)}</a>
            </td>
          </tr>`;
        })
        .join("");
      return row(panel(rows), "6px 40px 24px");
    }
    case "signature": {
      // Last line is the name.
      const lines = block.lines.map((line, i) =>
        i === block.lines.length - 1
          ? `<span style="font-weight:600;color:${C.heading};">${escapeHtml(line)}</span>`
          : escapeHtml(line),
      );
      return row(
        `<p style="margin:0;font-family:${FONT};font-size:16px;line-height:26px;color:${C.text};">${lines.join("<br>")}</p>`,
        "14px 40px 0",
      );
    }
  }
}

function blockText(block: Block): string {
  switch (block.kind) {
    case "heading":
      return block.text;
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
    case "items":
      return block.items
        .map((i) => `${i.title}${i.tag ? ` (${i.tag.toLowerCase()})` : ""}\n${i.meta}\n${i.linkLabel}: ${i.href}`)
        .join("\n\n");
  }
}

/** Mark plus name, as in the app header. */
function lockup(markSize: number, fontSize: number, color: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="middle" style="padding-right:${Math.round(markSize * 0.42)}px;"><img src="${BRAND.markUrl}" width="${markSize}" height="${markSize}" alt="" style="display:block;border:0;" /></td>
    <td valign="middle" style="font-family:${FONT};font-size:${fontSize}px;line-height:${markSize}px;font-weight:600;color:${color};white-space:nowrap;">${BRAND.name}</td>
  </tr></table>`;
}

export function renderEmail(content: EmailContent): RenderedEmail {
  const { subject, preheader, hero, blocks, reason, unsubscribeUrl } = content;

  const header = `<tr><td class="px" align="left" style="padding:36px 40px ${hero ? 24 : 36}px;">
      <a href="${SITE_URL}" target="_blank" style="text-decoration:none;">${lockup(24, 17, C.heading)}</a>
    </td></tr>`;

  const art = hero
    ? `<tr><td style="padding:0 0 20px;font-size:0;line-height:0;">
        <img src="${escapeHtml(hero.src)}" width="600" alt="${escapeHtml(hero.alt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
      </td></tr>`
    : "";

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
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
  :root { color-scheme: dark; supported-color-schemes: dark; }
  body { margin: 0; padding: 0; width: 100% !important; background: ${C.page}; }
  a { color: ${C.gold}; }
  @media (max-width: 480px) {
    .px { padding-left: 24px !important; padding-right: 24px !important; }
    .h { font-size: 27px !important; line-height: 33px !important; }
    .sc { padding: 14px 12px !important; }
    .sv { font-size: 18px !important; line-height: 24px !important; }
    .dg { width: 40px !important; height: 50px !important; font-size: 24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}${preheaderPad}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background-color:${C.page};">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
    ${header}
    ${art}
    ${blocks.map(blockHtml).join("\n")}
    <tr><td class="px" align="left" style="padding:40px 40px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${C.border};padding-top:24px;">
        ${lockup(16, 13, C.label)}
        <p style="margin:12px 0 4px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.footer};">${escapeHtml(reason)}</p>
        <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:${C.footer};"><a href="${SITE_URL}" target="_blank" style="color:${C.footer};text-decoration:underline;">generalsonline.app</a>${
          unsubscribeUrl
            ? ` · <a href="${escapeHtml(unsubscribeUrl)}" target="_blank" style="color:${C.footer};text-decoration:underline;">Unsubscribe</a>`
            : ""
        }</p>
      </td></tr></table>
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
    ...(unsubscribeUrl ? [`Unsubscribe: ${unsubscribeUrl}`] : []),
  ].join("\n");

  return { subject, preheader, html, text };
}
