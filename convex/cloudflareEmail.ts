// Sends transactional email through Cloudflare Email Sending.
// https://developers.cloudflare.com/email-service/api/send-emails/rest-api/
//
// Required Convex environment variables:
//   CLOUDFLARE_ACCOUNT_ID       Cloudflare account that owns the sending domain
//   CLOUDFLARE_EMAIL_API_TOKEN  API token with the Email Sending permission

const FROM = {
  address: "noreply@generalsonline.app",
  name: "Games of the Generals",
};

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Extra headers, e.g. List-Unsubscribe. Cloudflare rejects headers not on its allowlist. */
  headers?: Record<string, string>;
};

/** A failed send. `status` 429 means Cloudflare throttled us and nothing was sent. */
export class EmailSendError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly codes: number[],
  ) {
    super(message);
    this.name = "EmailSendError";
  }

  get throttled(): boolean {
    return this.status === 429 || this.codes.includes(10004);
  }
}

type CloudflareSendResponse = {
  success: boolean;
  errors: { code: number; message: string }[];
  result: {
    message_id: string;
    delivered: string[];
    queued: string[];
    permanent_bounces: string[];
    suppressed_recipients?: string[];
  } | null;
};

export async function sendEmail({ to, subject, html, text, headers }: SendEmailInput): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_EMAIL_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error("Email is not configured: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_EMAIL_API_TOKEN");
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html, text, ...(headers ? { headers } : {}) }),
    },
  );

  let body: CloudflareSendResponse | null = null;
  try {
    body = (await res.json()) as CloudflareSendResponse;
  } catch {
    // Non-JSON response; handled below.
  }

  if (!res.ok || !body?.success || !body.result) {
    const detail = body?.errors?.map((e) => `${e.code} ${e.message}`).join("; ") || `HTTP ${res.status}`;
    // 10000 means the token is valid but isn't allowed to send for this account.
    const hint = body?.errors?.some((e) => e.code === 10000)
      ? ". CLOUDFLARE_EMAIL_API_TOKEN needs the Email Sending permission on this account."
      : "";
    throw new EmailSendError(
      `Cloudflare email send failed: ${detail}${hint}`,
      res.status,
      body?.errors?.map((e) => e.code) ?? [],
    );
  }

  const { permanent_bounces, suppressed_recipients = [] } = body.result;
  const undeliverable = [...permanent_bounces, ...suppressed_recipients];
  if (undeliverable.length > 0) {
    throw new EmailSendError(`Email could not be delivered to: ${undeliverable.join(", ")}`, 200, []);
  }

  return body.result.message_id;
}
