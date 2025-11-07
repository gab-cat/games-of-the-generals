import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInForm } from '../auth/SignInForm'
import { SettingsPage } from '../pages/settings/00.settings-page'
import { useConvexQuery } from '../lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'
import { SetupPage } from '@/pages/setup/00.setup-page'
import { LoadingSpinner } from '../components/LoadingSpinner'

export const Route = createFileRoute('/settings')({
  validateSearch: (search: Record<string, unknown>): { convert?: string } => {
    return {
      convert: typeof search.convert === 'string' ? search.convert : undefined,
    }
  },
  component: SettingsComponent,
})

function SettingsComponent() {
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
          <SettingsPage />
        )}
      </Authenticated>
    </>
  )
}
