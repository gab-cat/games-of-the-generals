import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInForm } from '../auth/SignInForm'
import { useConvexQuery } from '../lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'
import { Suspense, lazy } from 'react'
import { LoadingSpinner } from '../components/LoadingSpinner'

// Lazy load page components
const MatchHistoryPage = lazy(() => import('../pages/match-history/00.match-history-page').then(module => ({ default: module.MatchHistoryPage })))
const SetupPage = lazy(() => import('@/pages/setup/00.setup-page').then(module => ({ default: module.SetupPage })))

function MatchHistoryComponent() {
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
            <MatchHistoryPage userId={profile.userId} />
          </Suspense>
        )}
      </Authenticated>
    </>
  )
}

export const Route = createFileRoute('/match-history')({
  component: MatchHistoryComponent,
})
