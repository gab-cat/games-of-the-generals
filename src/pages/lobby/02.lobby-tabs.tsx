import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Sword, Eye } from "lucide-react";
import { LobbyListTab } from "./03.lobby-list-tab";
import { SpectateTab } from "./04.spectate-tab";
import { Id } from "../../../convex/_generated/dataModel";

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
}

interface LobbyTabsProps {
  activeTab: "lobbies" | "spectate";
  onTabChange: (tab: "lobbies" | "spectate") => void;
  profile: Profile;
  onGameStart: (gameId: string) => void;
  onSpectateGame: (gameId: string) => void;
  startGameMutation: any;
  spectateByIdMutation: any;
  onOpenMessaging?: (lobbyId?: Id<"lobbies">) => void;
}

export function LobbyTabs({
  activeTab,
  onTabChange,
  profile,
  onGameStart,
  onSpectateGame,
  startGameMutation,
  spectateByIdMutation,
  onOpenMessaging,
}: LobbyTabsProps) {
  const handleTabChange = (value: string) => {
    onTabChange(value as "lobbies" | "spectate");
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex justify-center w-full mb-6">
          <TabsList className="bg-zinc-900/80 backdrop-blur-md border border-white/10 p-1 rounded-sm w-full max-w-sm h-auto grid grid-cols-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />
            <TabsTrigger
              value="lobbies"
              className="rounded-sm data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/10 text-zinc-400 py-2.5 transition-all duration-300 relative overflow-hidden group"
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                <Sword className="h-4 w-4" />
                <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                  Battle Rooms
                </span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="spectate"
              className="rounded-sm data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/10 text-zinc-400 py-2.5 transition-all duration-300 relative overflow-hidden group"
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                <Eye className="h-4 w-4" />
                <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                  Spectator Feed
                </span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="lobbies"
          className="mt-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <LobbyListTab
            profile={profile}
            onGameStart={onGameStart}
            startGameMutation={startGameMutation}
            onOpenMessaging={onOpenMessaging}
          />
        </TabsContent>

        <TabsContent
          value="spectate"
          className="mt-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <SpectateTab
            onSpectateGame={onSpectateGame}
            spectateByIdMutation={spectateByIdMutation}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
