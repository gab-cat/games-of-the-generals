import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { lazy, Suspense } from 'react'
import { SignInForm } from '@/auth/SignInForm'

// Lazy load the SupportTicketsPage component
const SupportTicketsPage = lazy(() => import('../pages/support/00.support-tickets-page').then(module => ({ default: module.SupportTicketsPage })))

function SupportComponent() {
  return (
    <>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-white/60">Loading support tickets...</p>
              </div>
            </div>
          }
        >
          <SupportTicketsPage />
        </Suspense>
      </Authenticated>
    </>
  )
}

export const Route = createFileRoute('/support')({
  component: SupportComponent,
})
