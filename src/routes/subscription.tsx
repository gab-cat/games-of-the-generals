import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInForm } from '../auth/SignInForm'
import { SubscriptionPage } from '../pages/subscription/00.subscription-page'
import { useConvexQuery } from '../lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'
import { LoadingSpinner } from '../components/LoadingSpinner'

function SubscriptionComponent() {
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
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <SubscriptionPage />
        )}
      </Authenticated>
    </>
  )
}

export const Route = createFileRoute('/subscription')({
  component: SubscriptionComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      subscription: (search.subscription as string | undefined) || undefined,
    };
  },
})
