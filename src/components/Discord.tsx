import { useState, type SVGProps } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import {
  DISCORD_INVITE_DISMISS_KEY,
  DISCORD_INVITE_HIDE_MS,
  DISCORD_INVITE_URL,
  DISCORD_SERVER_NAME,
} from "@/lib/community";
import { isDismissed } from "@/lib/tournament-invite";
import { cn } from "@/lib/utils";

/*
 * Links to the Generals Online Discord. The header button and account menu
 * item are on every signed-in page; the lobby invite is the loud one and can
 * be hidden. Discord's own blurple marks every spot so players recognise it.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/** Discord's logo mark. Fills with the current text colour. */
export function DiscordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.1.246.198.373.292a.077.077 0 0 1-.007.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

/** Icon button for the signed-in header, next to "How to play" and messages. */
export function DiscordHeaderButton({ className }: { className?: string }) {
  return (
    <a
      href={DISCORD_INVITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Join the ${DISCORD_SERVER_NAME} Discord (opens in a new tab)`}
      title="Join our Discord"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-[#8c95ff] transition-[background-color,color,transform] duration-150 hover:bg-[#5865F2]/15 hover:text-[#aab0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.94]",
        className,
      )}
    >
      <DiscordIcon className="size-5" />
    </a>
  );
}

function readHidden() {
  try {
    return isDismissed(localStorage.getItem(DISCORD_INVITE_DISMISS_KEY), Date.now());
  } catch {
    return false;
  }
}

function hideForAWhile() {
  try {
    localStorage.setItem(
      DISCORD_INVITE_DISMISS_KEY,
      String(Date.now() + DISCORD_INVITE_HIDE_MS),
    );
  } catch {
    // Private mode: it comes back on the next visit.
  }
}

/**
 * The lobby's invite to the Discord. Joining or closing it hides it for 60
 * days; the header button stays for anyone who wants it later.
 */
export function DiscordLobbyInvite() {
  const [hidden, setHidden] = useState(readHidden);

  const hide = () => {
    hideForAWhile();
    setHidden(true);
  };

  return (
    <AnimatePresence initial={false}>
      {!hidden && (
        <motion.section
          key="discord-invite"
          aria-labelledby="discord-invite-title"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="relative overflow-hidden rounded-lg border border-[#5865F2]/40 bg-[#5865F2]/[0.09]"
        >
          <div className="flex items-center gap-3 p-3 pr-11 sm:gap-4 sm:p-4 sm:pr-14">
            <DiscordIcon className="size-8 shrink-0 text-[#8c95ff] sm:size-10" />
            <div className="min-w-0 flex-1">
              <h2
                id="discord-invite-title"
                className="text-[15px] font-semibold leading-snug text-foreground sm:text-lg"
              >
                <span className="sm:hidden">We&apos;re on Discord</span>
                <span className="hidden sm:inline">
                  {DISCORD_SERVER_NAME} is on Discord
                </span>
              </h2>
              {/* Shorter on phones, so the card stays one row tall. */}
              <p className="mt-0.5 text-[13px] leading-snug text-foreground/85 sm:text-sm">
                <span className="sm:hidden">Find players and get updates.</span>
                <span className="hidden sm:inline">
                  Find players for a match, report bugs and hear about updates
                  first.
                </span>
              </p>
            </div>
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              // Hide after the tab opens, so the click isn't lost to a re-render.
              onClick={() => setTimeout(hide, 400)}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#5865F2] px-3.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#4752c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] sm:px-4"
            >
              Join
              <span className="hidden sm:inline">the server</span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>

          <button
            type="button"
            onClick={hide}
            title="Hide"
            aria-label="Hide the Discord invite"
            className="absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-foreground/80 transition-[background-color,color] hover:bg-white/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 sm:right-2"
          >
            <X className="size-4" />
          </button>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
