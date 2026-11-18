import { motion } from "framer-motion";
import { Github, Linkedin, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/BrandMark";
import { DiscordIcon } from "@/components/Discord";
import { DISCORD_INVITE_URL } from "@/lib/community";
import { fadeUp, stagger } from "@/lib/motion";

const CONTACT = {
  email: "catimbanggabriel@gmail.com",
  linkedin: "https://www.linkedin.com/in/gabrielcatimbang/",
  messenger: "https://m.me/gab.cat30",
  github: "https://github.com/gab-cat/games-of-the-generals",
} as const;

const LINKS = [
  { label: "Discord", href: DISCORD_INVITE_URL, icon: DiscordIcon },
  { label: "GitHub", href: CONTACT.github, icon: Github },
  { label: "LinkedIn", href: CONTACT.linkedin, icon: Linkedin },
  { label: "Messenger", href: CONTACT.messenger, icon: MessageCircle },
];

export function MaintenancePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_45%_at_50%_0%,#000_60%,transparent_100%)]" />
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(217,164,65,0.06),transparent)]" />
      </div>

      <header className="relative z-10 mx-auto flex h-14 w-full max-w-7xl items-center px-4 sm:h-16 sm:px-6">
        <BrandLockup />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 pb-12 pt-4 sm:px-6 sm:pb-16">
        <motion.div
          variants={stagger(0.06)}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <motion.img
            variants={fadeUp}
            src="/season/season-3-banner.webp"
            alt="Season 3. Games of the Generals"
            width={1600}
            height={640}
            className="aspect-[5/2] w-full rounded-lg border border-border object-cover"
          />

          <motion.div variants={fadeUp}>
            <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
              The game is offline for now
            </h1>
            <div className="mt-4 space-y-3 text-base text-foreground/90">
              <p>
                Hi, I&apos;m Gabriel. I built this so people could play Game of
                the Generals online with friends. Keeping the servers running
                has become too expensive for me to cover on my own, so the site
                is offline for now.
              </p>
              <p>
                If you&apos;d like to help keep it alive, I&apos;d really
                appreciate it. Send me a note anytime.
              </p>
              <p>
                News about the game coming back goes to the Discord first.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-3">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href={`mailto:${CONTACT.email}`} className="break-all">
                <Mail />
                {CONTACT.email}
              </a>
            </Button>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {LINKS.map(({ label, href, icon: Icon }) => (
                <Button key={label} asChild variant="secondary">
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    <Icon />
                    {label}
                  </a>
                </Button>
              ))}
            </div>
          </motion.div>

          <motion.p variants={fadeUp} className="text-sm text-foreground/80">
            Thank you for playing.
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}
