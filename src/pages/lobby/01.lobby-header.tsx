import { QuickMatchHero, type Opponent } from "./fight-card";

interface Profile {
  username: string;
  wins: number;
  rank: string;
  elo?: number;
  avatarUrl?: string;
  avatarFrame?: string;
}

interface LobbyHeaderProps {
  profile: Profile;
  /** Who stands in the red corner: anyone, the search, or the joined player. */
  opponent: Opponent;
}

/** The top of the lobby: you against whoever's next, as a Season 3 title card. */
export function LobbyHeader({ profile, opponent }: LobbyHeaderProps) {
  return <QuickMatchHero profile={profile} opponent={opponent} />;
}
