import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { lazy, Suspense, useState, useCallback } from 'react'
import { ConvertAnonymousPopup } from '../components/ConvertAnonymousPopup'
import { Toaster } from 'sonner'
import { useConvexQuery } from '../lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

// Lazy load Layout component for better code splitting
const Layout = lazy(() => import('../components/Layout').then(module => ({ default: module.Layout })))

function RootComponent() {
  const { data: profile } = useConvexQuery(api.profiles.getCurrentProfile)
  const [lobbyInviteHandler, setLobbyInviteHandler] = useState<((lobbyId: Id<"lobbies">) => void) | null>(null)

  // This function will be called by Layout to register the handler
  const onOpenMessagingWithLobby = useCallback((handler: (lobbyId: Id<"lobbies">) => void) => {
    setLobbyInviteHandler(() => handler)
  }, [])

  // Expose the openMessagingWithLobby function globally
  // This can be used by any component that needs to open messaging with a lobby invite
  if (typeof window !== 'undefined' && lobbyInviteHandler) {
    (window as any).openMessagingWithLobby = lobbyInviteHandler
  }
  
  return (
    <div className="min-h-screen">
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
          </div>
        }
      >
        <Layout
          user={profile ? { username: profile.username } : undefined}
          onOpenMessagingWithLobby={onOpenMessagingWithLobby}
        >
          <Outlet />
        </Layout>
      </Suspense>
      <ConvertAnonymousPopup />
      <Toaster theme="dark" className="rounded-2xl" />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})
