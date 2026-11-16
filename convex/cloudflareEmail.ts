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
};

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

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<string> {
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
      body: JSON.stringify({ from: FROM, to, subject, html, text }),
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
    throw new Error(`Cloudflare email send failed: ${detail}`);
  }

  const { permanent_bounces, suppressed_recipients = [] } = body.result;
  const undeliverable = [...permanent_bounces, ...suppressed_recipients];
  if (undeliverable.length > 0) {
    throw new Error(`Email could not be delivered to: ${undeliverable.join(", ")}`);
  }

  return body.result.message_id;
}
