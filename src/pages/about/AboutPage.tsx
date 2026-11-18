import { motion } from "framer-motion";
import { Github, Linkedin, Mail } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { OtherGameCard } from "@/components/OtherGames";
import { DiscordIcon } from "@/components/Discord";
import { DISCORD_INVITE_URL } from "@/lib/community";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { fadeUp, stagger } from "@/lib/motion";

const linkClass =
  "rounded text-gold-300 underline underline-offset-4 hover:text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70";

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="About"
        description="Games of the Generals is the Filipino board game Salpakan, played online against real people."
      />

      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="show"
        className="space-y-8 text-[15px] leading-7 text-foreground sm:space-y-10"
      >
        <motion.section variants={fadeUp}>
          <SectionHeader title="The game" />
          <p>
            Each player sets up 21 pieces on their side of the board. You can
            see your own pieces. You cannot see your opponent&apos;s ranks, so
            every move is a guess about what is hiding behind the piece in front
            of you. The higher rank wins a challenge, and capturing the flag or
            reaching the far row with yours ends the game.
          </p>
          <p className="mt-4">
            This site keeps the rules of the classic game. You can play live
            lobbies, practise against the AI, watch other games as a spectator
            and review any finished game as a replay.
          </p>
        </motion.section>

        <motion.section variants={fadeUp}>
          <SectionHeader title="Who made it" />
          <p>
            Games of the Generals is built and run by Gabriel Catimbang. He
            built it to preserve the classic Game of the Generals and bring it
            online.
          </p>
          <OtherGameCard placement="about" className="mt-4 max-w-md" />
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">
                <DiscordIcon className="text-[#8c95ff]" />
                Discord
              </a>
            </Button>
            <Button variant="secondary" asChild>
              <a
                href="https://github.com/gab-cat/games-of-the-generals"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github />
                Source code
              </a>
            </Button>
            <Button variant="secondary" asChild>
              <a
                href="https://www.linkedin.com/in/gabrielcatimbang/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin />
                LinkedIn
              </a>
            </Button>
            <Button variant="secondary" asChild>
              <a href="mailto:gabriel.catimbang@gmail.com">
                <Mail />
                Email
              </a>
            </Button>
          </div>
        </motion.section>

        <motion.section variants={fadeUp}>
          <SectionHeader title="Help and support" />
          <p>
            The game is free to play. If you want to help cover the running
            costs, you can{" "}
            <Link
              to="/pricing"
              search={{ donation: undefined }}
              hash="donate"
              className={linkClass}
            >
              make a donation
            </Link>
            . For a bug or a question, open a{" "}
            <Link
              to="/support"
              search={{ ticketId: undefined }}
              className={linkClass}
            >
              support ticket
            </Link>
            . News about changes is on the{" "}
            <Link to="/announcements" className={linkClass}>
              news page
            </Link>
            . To talk with other players or find a match, join the{" "}
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Discord
            </a>
            .
          </p>
        </motion.section>

        <motion.footer
          variants={fadeUp}
          className="flex flex-col gap-3 border-t border-border pt-6 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="text-muted-foreground">
            © {new Date().getFullYear()} Games of the Generals
          </span>
          <nav className="flex gap-5" aria-label="Legal">
            <Link to="/privacy" className={linkClass}>
              Privacy policy
            </Link>
            <Link to="/terms" className={linkClass}>
              Terms and conditions
            </Link>
          </nav>
        </motion.footer>
      </motion.div>
    </div>
  );
}
