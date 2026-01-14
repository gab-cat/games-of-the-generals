import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { lazy, Suspense } from 'react'
import { SignInForm } from '@/auth/SignInForm'
import { useConvexQuery } from '@/lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

// Lazy load the SupportResolvePage component
const SupportResolvePage = lazy(() => import('../pages/support/resolve').then(module => ({ default: module.SupportResolvePage })))

function SupportResolveComponent() {
  const { data: profile } = useConvexQuery(
    api.profiles.getCurrentProfile,
    {}
  );

  // Check if user is admin/moderator
  const isAdmin = profile?.adminRole;

  return (
    <>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        {!isAdmin ? (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 max-w-md mx-4">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white/90 mb-2">Access Denied</h2>
                <p className="text-white/60 mb-4">
                  You don't have permission to access the admin support center.
                </p>
                <p className="text-white/50 text-sm">
                  This page is only available to administrators and moderators.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-white/60">Loading admin support center...</p>
                </div>
              </div>
            }
          >
            <SupportResolvePage />
          </Suspense>
        )}
      </Authenticated>
    </>
  )
}

export const Route = createFileRoute('/support-resolve')({
  component: SupportResolveComponent,
})
