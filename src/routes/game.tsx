import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInForm } from '../auth/SignInForm'
import { useConvexQuery } from '../lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'
import { Suspense, lazy } from 'react'
import { LoadingSpinner } from '../components/LoadingSpinner'

// Lazy load page components
const GamePage = lazy(() => import('../pages/game/00.game-page').then(module => ({ default: module.GamePage })))
const SetupPage = lazy(() => import('@/pages/setup/00.setup-page').then(module => ({ default: module.SetupPage })))

function GameComponent() {
  const { gameId } = Route.useSearch()
  const { isPending: isLoadingUser } = useConvexQuery(api.auth.loggedInUser)
  const { data: profile, isPending: isLoadingProfile } = useConvexQuery(api.profiles.getCurrentProfile)

  if (isLoadingUser || isLoadingProfile) {
    return <LoadingSpinner />
  }

  return (
    <>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        {!profile ? (
          <Suspense fallback={<LoadingSpinner />}>
            <SetupPage />
          </Suspense>
        ) : (
          <Suspense fallback={<LoadingSpinner />}>
            <GamePage profile={profile} gameId={gameId || ''} />
          </Suspense>
        )}
      </Authenticated>
    </>
  )
}

export const Route = createFileRoute('/game')({
  validateSearch: (search: Record<string, unknown>): { gameId?: string } => {
    return {
      gameId: typeof search.gameId === 'string' ? search.gameId : undefined,
    }
  },
  component: GameComponent,
})
