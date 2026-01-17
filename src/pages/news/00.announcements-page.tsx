import { AnnouncementsList } from "@/components/news/AnnouncementsList";
import { UpgradeDonationCTA } from "@/components/subscription/UpgradeDonationCTA";

export function AnnouncementsPage() {
  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <AnnouncementsList />
      </div>
      <UpgradeDonationCTA />
    </>
  );
}
