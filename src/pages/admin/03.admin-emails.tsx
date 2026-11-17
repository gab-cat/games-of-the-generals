import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Check, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import {
  EMAIL_CATALOG,
  type CatalogEntry,
  type EmailGroup,
} from "../../../convex/emails/catalog";
import { SITE_URL } from "../../../convex/emails/layout";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GROUPS: EmailGroup[] = [
  "Announcements",
  "Account",
  "Moderation",
  "Other",
];
const FROM = "Games of the Generals <noreply@generalsonline.app>";

type Width = "desktop" | "phone";
type View = "html" | "text";

const WIDTHS: Record<Width, number> = { desktop: 640, phone: 390 };

// Emails point at the live site. Load site assets from this origin instead, so images
// that aren't deployed yet (like a new banner) still show up in the preview.
function withLocalAssets(html: string): string {
  if (typeof window === "undefined" || window.location.origin === SITE_URL)
    return html;
  return html
    .split(`${SITE_URL}/icons/`)
    .join(`${window.location.origin}/icons/`)
    .split(`${SITE_URL}/email/`)
    .join(`${window.location.origin}/email/`);
}

export function AdminEmailsPage() {
  const search: { email?: string } = useSearch({ strict: false });
  const navigate = useNavigate();
  const selected =
    EMAIL_CATALOG.find((e) => e.id === search.email) ?? EMAIL_CATALOG[0];
  const rendered = useMemo(() => selected.render(), [selected]);

  const [width, setWidth] = useState<Width>(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches
      ? "phone"
      : "desktop",
  );
  const [view, setView] = useState<View>("html");

  const select = (id: string) =>
    void navigate({ to: ".", search: { email: id }, replace: true });

  return (
    <MotionConfig reducedMotion="user">
      <div className="text-foreground">
        <PageHeader
          title="Emails"
          description="Preview every email the app sends and send a test to any inbox."
        />

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Phone: one dropdown instead of the list */}
          <div className="lg:hidden">
            <Select value={selected.id} onValueChange={select}>
              <SelectTrigger className="w-full" aria-label="Email">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUPS.map((group) => (
                  <SelectGroup key={group}>
                    <SelectLabel>{group}</SelectLabel>
                    {EMAIL_CATALOG.filter((e) => e.group === group).map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-sm text-foreground/80">
              {selected.trigger}
            </p>
          </div>

          <EmailList selectedId={selected.id} onSelect={select} />

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="min-w-0 rounded-lg border border-border bg-card"
          >
            <InboxHeader
              subject={rendered.subject}
              preheader={rendered.preheader}
            />

            <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
              <Segmented
                label="Width"
                value={width}
                onChange={setWidth}
                options={[
                  { value: "desktop", label: "Desktop" },
                  { value: "phone", label: "Phone" },
                ]}
                disabled={view === "text"}
              />
              <Segmented
                label="Format"
                value={view}
                onChange={setView}
                options={[
                  { value: "html", label: "HTML" },
                  { value: "text", label: "Plain text" },
                ]}
              />
              <SendTestForm entry={selected} />
            </div>

            <div className="overflow-x-auto bg-background px-0 py-4 sm:p-6 rounded-b-lg">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${selected.id}-${view}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  {view === "html" ? (
                    <EmailFrame
                      html={rendered.html}
                      width={WIDTHS[width]}
                      title={rendered.subject}
                    />
                  ) : (
                    <pre className="mx-auto max-w-[640px] whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                      {rendered.text}
                    </pre>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.section>
        </div>
      </div>
    </MotionConfig>
  );
}

function EmailList({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  let index = 0;
  return (
    <nav aria-label="Emails" className="hidden lg:block space-y-6">
      {GROUPS.map((group) => (
        <div key={group}>
          <h2 className="mb-2 px-3 text-sm font-medium text-foreground/80">
            {group}
          </h2>
          <ul className="space-y-1">
            {EMAIL_CATALOG.filter((e) => e.group === group).map((e) => {
              const active = e.id === selectedId;
              const delay = 0.03 * index++;
              return (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay }}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(e.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "w-full rounded-md border px-3 py-2.5 text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                      "active:scale-[0.99]",
                      active
                        ? "border-gold-500/30 bg-gold-500/10"
                        : "border-transparent hover:border-border hover:bg-white/[0.04]",
                    )}
                  >
                    <span className="block text-sm font-medium text-foreground">
                      {e.name}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-foreground/70">
                      {e.trigger}
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function InboxHeader({
  subject,
  preheader,
}: {
  subject: string;
  preheader: string;
}) {
  return (
    <dl className="grid grid-cols-[80px_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-b border-border px-4 py-4 text-sm">
      <dt className="text-foreground/70">From</dt>
      <dd className="truncate text-foreground">{FROM}</dd>
      <dt className="text-foreground/70">Subject</dt>
      <dd className="font-medium text-foreground">{subject}</dd>
      <dt className="text-foreground/70">Preview</dt>
      <dd className="text-foreground">{preheader}</dd>
    </dl>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex rounded-md border border-border bg-background p-0.5",
        disabled && "opacity-50",
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-9 min-w-16 rounded px-3 text-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
            "disabled:cursor-not-allowed",
            value === o.value
              ? "bg-white/[0.08] text-foreground"
              : "text-foreground/80 hover:text-foreground enabled:active:bg-white/[0.04]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sends the selected email for real through Cloudflare. Empty field = your own address.
function SendTestForm({ entry }: { entry: CatalogEntry }) {
  const sendTest = useAction(api.emailPreview.sendTestEmail);
  const recipient = useQuery(api.emailPreview.getTestRecipient);
  const ownEmail = recipient?.email ?? null;

  const [to, setTo] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setState("idle");
    return () => window.clearTimeout(resetTimer.current);
  }, [entry.id]);

  const trimmed = to.trim();
  const invalid = trimmed !== "" && !EMAIL.test(trimmed);
  const target = trimmed || ownEmail;

  const send = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (invalid) {
        toast.error(`${trimmed} isn't a valid email address`);
        return;
      }
      if (!target) {
        toast.error("Type an email address to send the test to");
        return;
      }
      setState("sending");
      try {
        const { sentTo } = await sendTest({
          emailId: entry.id,
          to: trimmed || undefined,
        });
        setState("sent");
        toast.success(`Test sent to ${sentTo}`);
        resetTimer.current = window.setTimeout(() => setState("idle"), 2500);
      } catch (error) {
        setState("idle");
        const message =
          error instanceof ConvexError && typeof error.data === "string"
            ? error.data
            : error instanceof Error
              ? error.message.replace(/^.*Uncaught Error: /s, "").split("\n")[0]
              : "";
        toast.error(
          message
            ? `Couldn't send the test: ${message}`
            : "Couldn't send the test",
        );
      }
    },
    [entry.id, invalid, sendTest, target, trimmed],
  );

  return (
    <form
      onSubmit={(e) => void send(e)}
      className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row"
    >
      <label htmlFor="test-recipient" className="sr-only">
        Send the test to
      </label>
      <Input
        id="test-recipient"
        type="email"
        inputMode="email"
        autoComplete="off"
        spellCheck={false}
        value={to}
        onChange={(e) => {
          setTo(e.target.value);
          if (state === "sent") setState("idle");
        }}
        placeholder={ownEmail ?? "name@example.com"}
        aria-invalid={invalid || undefined}
        disabled={state === "sending"}
        className="sm:w-64"
      />
      <Button
        type="submit"
        disabled={state === "sending"}
        variant={state === "sent" ? "secondary" : "default"}
        className="shrink-0"
      >
        {state === "sending" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : state === "sent" ? (
          <Check className="size-4 text-emerald-400" />
        ) : (
          <Send className="size-4" />
        )}
        {state === "sending" ? "Sending" : state === "sent" ? "Sent" : "Send test"}
      </Button>
    </form>
  );
}

function EmailFrame({
  html,
  width,
  title,
}: {
  html: string;
  width: number;
  title: string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(900);
  const srcDoc = useMemo(() => withLocalAssets(html), [html]);

  const measure = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (doc?.body) setHeight(Math.max(doc.documentElement.scrollHeight, 400));
  }, []);

  // Re-measure when the width changes or late images load.
  useEffect(() => {
    const doc = ref.current?.contentDocument;
    measure();
    const images = Array.from(doc?.images ?? []);
    images.forEach((img) => img.addEventListener("load", measure));
    return () =>
      images.forEach((img) => img.removeEventListener("load", measure));
  }, [width, srcDoc, measure]);

  return (
    <iframe
      ref={ref}
      title={`Preview: ${title}`}
      srcDoc={srcDoc}
      onLoad={measure}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      style={{
        width: `min(${width}px, 100%)`,
        minWidth: width > 400 ? width : undefined,
        height,
      }}
      className="mx-auto block max-w-none border-0 transition-[width] duration-200"
    />
  );
}
