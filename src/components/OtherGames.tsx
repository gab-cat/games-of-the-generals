import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Gabriel's other games, linked from the credit lines (sign-in page, footer,
 * About) and the bottom of the upgrade/donate dialog. The utm tags let nightclubcity.app's analytics count visits per spot.
 */

type Placement = "signin" | "footer" | "footer-minimal" | "about" | "upgrade-dialog";

const NIGHTCLUB_CITY = {
  name: "Nightclub City: Neon",
  url: "https://nightclubcity.app/",
  image: "/promo/nightclub-city-neon.webp",
} as const;

export function nightclubCityUrl(placement: Placement) {
  const url = new URL(NIGHTCLUB_CITY.url);
  url.searchParams.set("utm_source", "generals");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", placement);
  return url.toString();
}

/**
 * A link card with the game's poster. "sm" is a shorter version for spots
 * where it sits under something more important, like the upgrade dialog.
 */
export function OtherGameCard({
  placement,
  size = "md",
  className,
}: {
  placement: Placement;
  size?: "md" | "sm";
  className?: string;
}) {
  const small = size === "sm";
  return (
    <a
      href={nightclubCityUrl(placement)}
      target="_blank"
      rel="noopener"
      className={cn(
        "group flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.02] p-2 pr-3 transition-[background-color,border-color,transform] duration-150",
        "hover:border-[#b56cff]/45 hover:bg-[#b56cff]/[0.06] active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
        className,
      )}
    >
      <img
        src={NIGHTCLUB_CITY.image}
        alt=""
        width={small ? 69 : 96}
        height={small ? 36 : 50}
        loading="lazy"
        decoding="async"
        className={cn(
          "shrink-0 rounded-[4px] object-cover",
          small ? "h-9 w-[69px]" : "h-[50px] w-24",
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-sm font-medium text-foreground">
          {NIGHTCLUB_CITY.name}
          <ArrowUpRight
            aria-hidden="true"
            className="size-3.5 shrink-0 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-foreground/75">
          {small
            ? "Gabriel's other game, free in closed beta."
            : "Gabriel's other game. Run a nightclub in your browser, free in closed beta."}
        </span>
      </span>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** A one-line text link, for tight rows like the signed-in footer. */
export function OtherGameLink({
  placement,
  className,
}: {
  placement: Placement;
  className?: string;
}) {
  return (
    <a
      href={nightclubCityUrl(placement)}
      target="_blank"
      rel="noopener"
      className={cn("group inline-flex items-center gap-1", className)}
    >
      {NIGHTCLUB_CITY.name}, also by Gabriel
      <ArrowUpRight
        aria-hidden="true"
        className="size-3.5 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
