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
        <CardHeader>
          <TabsList className="grid rounded-full w-fit grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20 mx-auto">
            <TabsTrigger value="lobbies" className="flex rounded-full items-center gap-2 border data-[state=active]:border-white/30 data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white">
              <Sword className="h-4 w-4" />
              Battle Lobbies
            </TabsTrigger>
            <TabsTrigger value="spectate" className="flex rounded-full items-center gap-2 border data-[state=active]:border-white/30 data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white">
              <Eye className="h-4 w-4" />
              Spectate
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent>
          <TabsContent value="lobbies" className="space-y-4">
            <LobbyListTab 
              profile={profile} 
              onGameStart={onGameStart}
              startGameMutation={startGameMutation}
              onOpenMessaging={onOpenMessaging}
            />
          </TabsContent>

          <TabsContent value="spectate" className="space-y-4">
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
