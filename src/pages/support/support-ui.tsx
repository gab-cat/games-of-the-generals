import {
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Paperclip,
  Loader2,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const CATEGORY_LABEL: Record<string, string> = {
  bug_report: "Bug report",
  feature_request: "Feature request",
  account_issue: "Account",
  game_issue: "Gameplay",
  other: "Other",
  donation: "Donation",
};

export function statusLabel(status: string) {
  return STATUS_LABEL[status] ?? status.replace(/_/g, " ");
}
export function priorityLabel(priority: string) {
  return PRIORITY_LABEL[priority] ?? priority;
}
export function categoryLabel(category: string) {
  return (
    CATEGORY_LABEL[category] ??
    category.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}

/** Status shown as icon plus words, so it never relies on colour alone. */
export function StatusBadge({ status }: { status: string }) {
  const icon =
    status === "open" ? (
      <Clock className="size-3" />
    ) : status === "in_progress" ? (
      <RefreshCw className="size-3" />
    ) : status === "resolved" ? (
      <CheckCircle2 className="size-3" />
    ) : (
      <XCircle className="size-3" />
    );
  const variant =
    status === "open"
      ? "default"
      : status === "resolved"
        ? "success"
        : status === "closed"
          ? "outline"
          : "secondary";
  return (
    <Badge variant={variant}>
      {icon}
      {statusLabel(status)}
    </Badge>
  );
}

/** Priority as words. Only urgent gets a colour, and it still says "Urgent". */
export function PriorityText({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        "text-xs font-medium",
        priority === "urgent" ? "text-red-300" : "text-foreground/80",
      )}
    >
      {priorityLabel(priority)} priority
    </span>
  );
}

function parseSystemChange(message: string) {
  let m = message.match(/^Status changed from (\w+) to (\w+)/);
  if (m?.[1] && m[2]) {
    return `Status changed from ${statusLabel(m[1].toLowerCase()).toLowerCase()} to ${statusLabel(m[2].toLowerCase()).toLowerCase()}`;
  }
  m = message.match(/^Priority changed from (\w+) to (\w+)/);
  if (m?.[1] && m[2]) {
    return `Priority changed from ${m[1].toLowerCase()} to ${m[2].toLowerCase()}`;
  }
  m = message.match(/^Ticket assigned to (.+)/);
  if (m?.[1]) return `Assigned to ${m[1]}`;
  return null;
}

interface ThreadTicket {
  description: string;
  username: string;
  createdAt: number;
  attachmentUrl?: string;
}
interface ThreadUpdate {
  _id: string;
  message: string;
  timestamp: number;
  username: string;
  isAdminResponse: boolean;
  attachmentUrl?: string;
}

function Message({
  author,
  isSupport,
  time,
  children,
}: {
  author: string;
  isSupport?: boolean;
  time: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "rounded-lg border p-4",
        isSupport
          ? "border-gold-500/30 bg-gold-500/[0.04]"
          : "border-border bg-card",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-medium text-foreground">{author}</span>
        {isSupport && <Badge variant="default">Support team</Badge>}
        <time
          dateTime={new Date(time).toISOString()}
          className="text-xs text-muted-foreground"
        >
          {format(new Date(time), "MMM d, yyyy, h:mm a")}
        </time>
      </div>
      {children}
    </motion.div>
  );
}

function AttachmentLink({ url, label }: { url: string; label: string }) {
  return (
    <Button variant="secondary" size="sm" asChild className="mt-3">
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Paperclip />
        {label}
      </a>
    </Button>
  );
}

/** The original request followed by every reply, oldest first. */
export function TicketThread({
  ticket,
  updates,
}: {
  ticket: ThreadTicket;
  updates: ThreadUpdate[];
}) {
  return (
    <motion.div
      variants={stagger(0.04)}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      <Message author={ticket.username} time={ticket.createdAt}>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
          {ticket.description}
        </p>
        {ticket.attachmentUrl && (
          <AttachmentLink url={ticket.attachmentUrl} label="View attachment" />
        )}
      </Message>

      {updates.map((update) => {
        const change = parseSystemChange(update.message);
        if (change) {
          return (
            <motion.p
              key={update._id}
              variants={fadeUp}
              className="py-1 text-center text-xs text-foreground/80"
            >
              {change}
              <span className="text-muted-foreground">
                {" "}
                · {format(new Date(update.timestamp), "MMM d, h:mm a")}
              </span>
            </motion.p>
          );
        }
        return (
          <Message
            key={update._id}
            author={update.username}
            isSupport={update.isAdminResponse}
            time={update.timestamp}
          >
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
              {update.message}
            </p>
            {update.attachmentUrl && (
              <AttachmentLink
                url={update.attachmentUrl}
                label="View attachment"
              />
            )}
          </Message>
        );
      })}

      {updates.length === 0 && (
        <p className="py-3 text-center text-sm text-foreground/80">
          No replies yet. We will answer here.
        </p>
      )}
    </motion.div>
  );
}

/** Reply box. Enter sends, Shift+Enter adds a line. */
export function ReplyBox({
  value,
  onChange,
  onSend,
  pending,
  testId,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  pending: boolean;
  testId?: string;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="ticket-reply"
        className="text-sm font-medium text-foreground"
      >
        Reply
      </label>
      <Textarea
        id="ticket-reply"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending}
        maxLength={2000}
        placeholder="Write a reply"
        className="max-h-[200px] min-h-[88px] resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (value.trim() && !pending) onSend();
          }
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs tabular-nums text-muted-foreground">
          {value.length} / 2000
        </span>
        <Button
          data-testid={testId}
          onClick={onSend}
          disabled={!value.trim() || pending}
        >
          {pending ? <Loader2 className="animate-spin" /> : <Send />}
          {pending ? "Sending" : "Send reply"}
        </Button>
      </div>
    </div>
  );
}
