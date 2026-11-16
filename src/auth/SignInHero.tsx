import { motion } from "framer-motion";
import { ChevronClash, SeasonSticker } from "@/components/season/ChevronClash";
import { cn } from "@/lib/utils";

/*
 * The sign-in page's left side: a title card for the game. The Season 3
 * chevrons collide over a huge wordmark, with the developer credit below.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

function MadeBy({ className }: { className?: string }) {
  const link =
    "whitespace-nowrap underline decoration-white/25 underline-offset-4 transition-colors hover:text-foreground hover:decoration-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 rounded-sm";
  return (
    <p className={cn("text-sm text-foreground/80", className)}>
      Made by{" "}
      <span className="whitespace-nowrap font-medium text-foreground">Gabriel Catimbang</span>
      <span className="mx-2 text-foreground/30" aria-hidden="true">
        ·
      </span>
      <a
        href="https://github.com/gab-cat/games-of-the-generals"
        target="_blank"
        rel="noreferrer"
        className={link}
      >
        Source code
      </a>
      <span className="mx-2 text-foreground/30" aria-hidden="true">
        ·
      </span>
      <a
        href="https://www.linkedin.com/in/gabrielcatimbang/"
        target="_blank"
        rel="noreferrer"
        className={link}
      >
        LinkedIn
      </a>
    </p>
  );
}

export function SignInHero() {
  return (
    <section className="relative isolate flex min-w-0 flex-col overflow-hidden border-b border-border bg-[#0a0909] lg:border-b-0 lg:border-r">
      <ChevronClash className="h-[240px] shrink-0 sm:h-[340px] lg:h-[48vh] lg:min-h-[340px] lg:max-h-[560px]">
        <SeasonSticker className="right-5 top-5 sm:right-8 sm:top-8 lg:right-12 lg:top-10" />
      </ChevronClash>

      <div className="relative flex flex-1 flex-col px-5 pb-6 pt-2 sm:px-8 sm:pb-8 lg:px-12 lg:pb-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7, ease: EASE }}
        >
          <h1 className="font-display text-foreground">
            <span className="block text-2xl font-semibold leading-none text-foreground/85 sm:text-3xl lg:text-4xl">
              Games of the
            </span>
            <span className="-ml-1 mt-1 block text-[clamp(3.6rem,15vw,7.25rem)] font-bold leading-[0.88] tracking-[-0.045em] lg:text-[clamp(5.5rem,9vw,9.5rem)]">
              Generals
            </span>
          </h1>
          <p className="mt-3 text-lg font-semibold text-gold-400 sm:text-xl">
            Salpakan, since 1970
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-4 max-w-md text-base text-foreground/85"
        >
          The Filipino strategy board game of hidden ranks, played live against
          real opponents.
        </motion.p>

        <MadeBy className="mt-6 border-t border-white/10 pt-4 sm:mt-auto" />
      </div>
    </section>
  );
}
