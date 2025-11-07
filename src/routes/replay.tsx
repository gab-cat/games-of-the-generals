import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInForm } from '../auth/SignInForm'
import { ReplayPage } from '../pages/replay/00.replay-page'
import { useConvexQuery } from '../lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'
import { SetupPage } from '@/pages/setup/00.setup-page'
import { LoadingSpinner } from '../components/LoadingSpinner'

function ReplayComponent() {
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
          <SetupPage />
        ) : (
          <ReplayPage gameId={gameId || ''} />
        )}
      </Authenticated>
    </>
  )
}

export const Route = createFileRoute('/replay')({
  validateSearch: (search: Record<string, unknown>): { gameId?: string } => {
    return {
      gameId: typeof search.gameId === 'string' ? search.gameId : undefined,
    }
  },
  component: ReplayComponent,
})
