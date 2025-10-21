import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInForm } from '../auth/SignInForm'
import { useConvexQuery } from '../lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'
import { motion } from 'framer-motion'
import { Suspense, lazy } from 'react'

// Lazy load page components
const AnnouncementsPage = lazy(() => import('../pages/news/00.announcements-page').then(module => ({ default: module.AnnouncementsPage })))
const SetupPage = lazy(() => import('@/pages/setup/00.setup-page').then(module => ({ default: module.SetupPage })))

function LoadingSpinner() {
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

function AnnouncementsComponent() {
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
            <AnnouncementsPage />
          </Suspense>
        )}
      </Authenticated>
    </>
  )
}

export const Route = createFileRoute('/announcements')({
  component: AnnouncementsComponent,
})
