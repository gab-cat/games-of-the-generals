import { Authenticated, Unauthenticated } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { ProfileSetup } from "./components/ProfileSetup";
import { GameLobby } from "./components/GameLobby";
import { Profile } from "./components/Profile";
import { Settings } from "./components/Settings";
import { Achievements } from "./components/Achievements";
import { Layout } from "./components/Layout";
import { motion } from "framer-motion";
import { useState } from "react";
import { useConvexQuery } from "./lib/convex-query-hooks";

export default function App() {
  return (
    <div className="min-h-screen">
      <Content />
      <Toaster theme="dark" className="rounded-2xl" />
    </div>
  );
}

function Content() {
  const { isPending: isLoadingUser} = useConvexQuery(api.auth.loggedInUser);
  const { data: profile, isPending: isLoadingProfile } = useConvexQuery(api.profiles.getCurrentProfile);
  const [currentPage, setCurrentPage] = useState<'lobby' | 'profile' | 'achievements' | 'settings'>('lobby');

  if (isLoadingUser || isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"
        />
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'profile':
        return <Profile />;
      case 'achievements':
        return <Achievements />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="max-w-7xl mx-auto px-4 py-8">
            {profile && <GameLobby profile={profile} />}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        {!profile ? (
          <ProfileSetup />
        ) : (
          <Layout 
            user={profile ? { username: profile.username } : undefined}
            onNavigate={setCurrentPage}
          >
            {renderCurrentPage()}
          </Layout>
        )}
      </Authenticated>
    </div>
  );
}
