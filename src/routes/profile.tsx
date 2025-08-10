import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInForm } from '../auth/SignInForm'
import { SetupPage } from '../pages/setup/00.setup-page'
import { ProfilePage } from '../pages/profile/00.profile-page'
import { useConvexQuery } from '../lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'
import { motion } from 'framer-motion'

function ProfileComponent() {
  const { isPending: isLoadingUser } = useConvexQuery(api.auth.loggedInUser)
  const { data: profile, isPending: isLoadingProfile } = useConvexQuery(api.profiles.getCurrentProfile)

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
  component: ProfileComponent,
})
