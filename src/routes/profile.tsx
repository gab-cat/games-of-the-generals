import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInForm } from '../auth/SignInForm'
import { SetupPage } from '../pages/setup/00.setup-page'
import { ProfilePage } from '../pages/profile/00.profile-page'
import { useConvexQuery } from '../lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'
import { LoadingSpinner } from '../components/LoadingSpinner'

function ProfileComponent() {
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
          <ProfilePage />
        )}
      </Authenticated>
    </>
  )
}

export const Route = createFileRoute('/profile')({
  validateSearch: (search: Record<string, unknown>): { u?: string } => {
    return {
      u: typeof search.u === 'string' ? search.u : undefined,
    }
  },
  component: ProfileComponent,
})
