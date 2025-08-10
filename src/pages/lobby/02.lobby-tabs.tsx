import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
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
  onOpenMessaging
}: LobbyTabsProps) {

  const handleTabChange = (value: string) => {
    onTabChange(value as "lobbies" | "spectate");
  };

  return (
    <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <CardHeader className="p-4 sm:px-6 sm:pt-4 sm:pb-0">
          <TabsList className="grid rounded-full h-full w-full sm:w-fit grid-cols-2 bg-black/20 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="lobbies" className="flex rounded-full transition-all items-center hover:bg-white/5 justify-center gap-2 data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white px-3 sm:px-4 py-2">
              <Sword className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">Battle Lobbies</span>
                <span className="sm:hidden">Lobbies</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="spectate" className="flex rounded-full transition-all hover:bg-white/5 items-center justify-center gap-2 data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white px-3 sm:px-4 py-2">
              <Eye className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Spectate</span>
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className="p-3 sm:p-6 sm:py-2">
          <TabsContent value="lobbies" className="space-y-3 sm:space-y-4">
            <LobbyListTab 
              profile={profile} 
              onGameStart={onGameStart}
              startGameMutation={startGameMutation}
              onOpenMessaging={onOpenMessaging}
            />
          </TabsContent>

          <TabsContent value="spectate" className="space-y-3 sm:space-y-4">
            <SpectateTab 
              onSpectateGame={onSpectateGame}
              spectateByIdMutation={spectateByIdMutation}
            />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
