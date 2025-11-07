import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInForm } from '../auth/SignInForm'
import { SetupPage } from '../pages/setup/00.setup-page'
import { PricingPage } from '../pages/pricing/00.pricing-page'
import { useConvexQuery } from '../lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'
import { LoadingSpinner } from '../components/LoadingSpinner'

function PricingComponent() {
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
          <PricingPage profile={profile} />
        )}
      </Authenticated>
    </>
  )
}

export const Route = createFileRoute('/pricing')({
  component: PricingComponent,
})
