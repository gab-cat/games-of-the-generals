import { AnnouncementsList } from "@/components/news/AnnouncementsList";
import { UpgradeDonationCTA } from "@/components/subscription/UpgradeDonationCTA";

export function AnnouncementsPage() {
  return (
    <>
      <AnnouncementsList />
      <UpgradeDonationCTA />
    </>
  );
}
