import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInForm } from '../auth/SignInForm'
import { SplashScreen } from '../components/SplashScreen'
import { SetupPage } from '../pages/setup/00.setup-page'
import { LobbyPage } from '../pages/lobby/00.lobby-page'
import { useConvexQuery } from '../lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'
import { motion } from 'framer-motion'
import { Id } from '../../convex/_generated/dataModel'
import { useEffect, useState } from 'react'

type IndexSearch = {
  lobbyId?: string
}

function IndexComponent() {
  const { lobbyId } = Route.useSearch()
  const { isPending: isLoadingUser } = useConvexQuery(api.auth.loggedInUser)
  const { data: profile, isPending: isLoadingProfile } = useConvexQuery(api.profiles.getCurrentProfile)
  const [showSplash, setShowSplash] = useState(false)

  const handleOpenMessaging = (lobbyId?: Id<"lobbies">) => {
    if (typeof window !== 'undefined' && (window as any).openMessagingWithLobby) {
      (window as any).openMessagingWithLobby(lobbyId)
    }
  }

  // Handle lobbyId from URL parameter - Only for navigation, not for opening messaging
  useEffect(() => {
    // Remove the automatic messaging panel opening
    // The lobbyId parameter is now only used for navigation after joining a lobby
  }, [lobbyId, profile]);

  // Check if user is unauthenticated and show splash screen
  useEffect(() => {
    if (!isLoadingUser && !isLoadingProfile && !profile) {
      setShowSplash(true)
    }
  }, [isLoadingUser, isLoadingProfile, profile])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  if (isLoadingUser || isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"
        />
      </div>
    )
  }

  return (
    <>
      <Unauthenticated>
        {showSplash ? (
          <SplashScreen onComplete={handleSplashComplete} />
        ) : (
          <SignInForm />
        )}
      </Unauthenticated>

      <Authenticated>
                {!profile ? (
          <SetupPage />
        ) : (
          <LobbyPage profile={profile} onOpenMessaging={handleOpenMessaging} />
        )}
      </Authenticated>
    </>
  )
}

export const Route = createFileRoute('/')({
  component: IndexComponent,
  validateSearch: (search: Record<string, unknown>): IndexSearch => {
    return {
      lobbyId: typeof search.lobbyId === 'string' ? search.lobbyId : undefined,
    }
  },
})
