import type { ReactNode } from "react";
import { Eye, Swords } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";

export type LobbyTab = "lobbies" | "spectate";

interface LobbyTabsProps {
  activeTab: LobbyTab;
  onTabChange: (tab: LobbyTab) => void;
  /** Open lobbies: the bouts you can join. */
  lobbies: ReactNode;
  /** Live games: the bouts you can watch. */
  watch: ReactNode;
}

/** Play (open lobbies) and Watch (live games), under the quick match card. */
export function LobbyTabs({
  activeTab,
  onTabChange,
  lobbies,
  watch,
}: LobbyTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as LobbyTab)}
      className="w-full"
    >
      <TabsList className="grid h-11 w-full max-w-sm grid-cols-2">
        <TabsTrigger value="lobbies">
          <Swords />
          Open lobbies
        </TabsTrigger>
        <TabsTrigger value="spectate">
          <Eye />
          Watch live
        </TabsTrigger>
      </TabsList>

      <TabsContent value="lobbies" className="mt-4 sm:mt-5">
        {lobbies}
      </TabsContent>

      <TabsContent value="spectate" className="mt-4 sm:mt-5">
        {watch}
      </TabsContent>
    </Tabs>
  );
}
