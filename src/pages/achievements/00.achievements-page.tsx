import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";
import { Grain } from "@/components/season/art";
import {
  AchievementsHeader,
  AchievementsHeaderSkeleton,
} from "./01.achievements-header";
import {
  Ribbon,
  RibbonDetail,
  RibbonTile,
  type Achievement,
  type RibbonProgress,
} from "./02.achievement-card";
import { percentOf, progressFor, type ProfileStats } from "./progress";

const CATEGORIES = [
  { value: "milestone", label: "Milestones" },
  { value: "rank", label: "Ranks" },
  { value: "streak", label: "Streaks" },
  { value: "combat", label: "Combat" },
  { value: "special", label: "Special" },
] as const;
const KNOWN = new Set<string>(CATEGORIES.map((c) => c.value));

const GRID = "grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 xl:grid-cols-4";

const listMotion = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03, delayChildren: 0.15 } },
};

function ribbonProgress(a: Achievement, stats: ProfileStats | null): RibbonProgress {
  if (a.unlocked) return { count: null, percent: 100 };
  const count = progressFor(a.id, stats);
  if (count) return { count, percent: percentOf(count) };
  const server = typeof a.progress === "number" ? Math.round(a.progress) : 0;
  return { count: null, percent: Math.max(0, Math.min(100, server)) };
}

function AchievementsSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading achievements">
      <AchievementsHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <Skeleton className="h-[156px] w-full rounded-lg sm:h-[196px]" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <div className={GRID}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-10 w-full rounded-[3px]" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="hidden h-[200px] rounded-lg lg:block" />
      </div>
    </div>
  );
}

export function AchievementsPage() {
  const navigate = useNavigate();
  const {
    data: achievements,
    isPending,
    error,
  } = useConvexQuery(api.achievements.getAllAchievements);
  const { data: profile } = useConvexQuery(api.profiles.getCurrentProfile);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = (achievements ?? []) as Achievement[];
  const progress = useMemo(() => {
    const stats: ProfileStats | null = profile ?? null;
    const map = new Map<string, RibbonProgress>();
    for (const a of (achievements ?? []) as Achievement[]) {
      map.set(a.id, ribbonProgress(a, stats));
    }
    return map;
  }, [achievements, profile]);

  if (isPending) return <AchievementsSkeleton />;

  if (error || !achievements) {
    return (
      <div className="space-y-8">
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
          Achievements
        </h1>
        <EmptyState
          title="Achievements didn't load"
          body="Check your connection and try again."
          action={
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  const progressOf = (a: Achievement) =>
    progress.get(a.id) ?? { count: null, percent: 0 };

  // Newest first on the rack, as a uniform wears its latest award on top.
  const unlocked = list
    .filter((a) => a.unlocked)
    .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0));
  const locked = list
    .filter((a) => !a.unlocked)
    .sort((a, b) => progressOf(b).percent - progressOf(a).percent);
  const byCategory = (c: string) => list.filter((a) => a.category === c);
  const other = list.filter((a) => !KNOWN.has(a.category));

  // Until something is picked: the latest ribbon earned, else the closest one.
  const selected =
    list.find((a) => a.id === selectedId) ?? unlocked[0] ?? locked[0] ?? null;

  const tile = (a: Achievement) => (
    <RibbonTile
      key={a.id}
      achievement={a}
      progress={progressOf(a)}
      selected={selected?.id === a.id}
      onSelect={() => setSelectedId(a.id)}
    />
  );

  const grid = (items: Achievement[]) => (
    <motion.div
      variants={listMotion}
      initial="hidden"
      animate="show"
      className={GRID}
    >
      {items.map(tile)}
    </motion.div>
  );

  const group = (label: string, items: Achievement[]) =>
    items.length === 0 ? null : (
      <section key={label} className="space-y-3">
        <h2 className="text-base font-semibold text-foreground sm:text-lg">
          {label}{" "}
          <span className="font-normal text-foreground/70">
            {items.filter((a) => a.unlocked).length} of {items.length}
          </span>
        </h2>
        {grid(items)}
      </section>
    );

  return (
    <div className="space-y-8">
      <AchievementsHeader
        unlockedCount={unlocked.length}
        totalCount={list.length}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-x-6 lg:gap-y-8">
        {/* The rack: earned ribbons only, newest on top, on uniform cloth */}
        <section
          aria-label="Your ribbon rack"
          className="relative overflow-hidden rounded-lg border border-border bg-[#14201a] px-4 py-10 sm:px-8 sm:py-14 lg:col-start-1"
        >
          <Grain opacity={0.28} />
          {unlocked.length === 0 ? (
            <div className="relative mx-auto flex h-24 max-w-[330px] flex-col items-center justify-center gap-3 rounded-[3px] border border-dashed border-foreground/40 px-4 text-center text-sm text-foreground sm:h-28">
              Your first ribbon goes here.
              <Button size="sm" onClick={() => void navigate({ to: "/" })}>
                Find a game
              </Button>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
              }}
              className="relative mx-auto flex max-w-[330px] flex-wrap-reverse justify-center gap-[3px] sm:max-w-[620px]"
            >
              {/* Reversed so the newest ribbon lands in the top row */}
              {[...unlocked].reverse().map((a) => (
                <Ribbon
                  key={a.id}
                  achievement={a}
                  progress={progressOf(a)}
                  selected={selected?.id === a.id}
                  onSelect={() => setSelectedId(a.id)}
                  className="h-[26px] w-[78px] sm:h-11 sm:w-[150px]"
                />
              ))}
            </motion.div>
          )}
        </section>

        {/* Detail: right of everything on desktop, under the rack on phone */}
        {selected && (
          <aside
            aria-live="polite"
            className="row-start-2 h-fit rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            <RibbonDetail
              achievement={selected}
              progress={progressOf(selected)}
            />
          </aside>
        )}

        <Tabs defaultValue="all" className="min-w-0 space-y-6 lg:col-start-1">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex min-w-max">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
              <TabsTrigger value="locked">Locked</TabsTrigger>
              {CATEGORIES.map((c) =>
                byCategory(c.value).length > 0 ? (
                  <TabsTrigger key={c.value} value={c.value}>
                    {c.label}
                  </TabsTrigger>
                ) : null,
              )}
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0 space-y-8">
            {CATEGORIES.map((c) => group(c.label, byCategory(c.value)))}
            {group("Other", other)}
          </TabsContent>

          <TabsContent value="unlocked" className="mt-0">
            {unlocked.length > 0 ? (
              grid(unlocked)
            ) : (
              <EmptyState
                title="Nothing unlocked yet"
                body="Win your first game to earn one."
                action={
                  <Button onClick={() => void navigate({ to: "/" })}>
                    Find a game
                  </Button>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="locked" className="mt-0">
            {locked.length > 0 ? (
              grid(locked)
            ) : (
              <EmptyState title="Everything is unlocked" />
            )}
          </TabsContent>

          {CATEGORIES.map((c) => (
            <TabsContent key={c.value} value={c.value} className="mt-0">
              {grid(byCategory(c.value))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
