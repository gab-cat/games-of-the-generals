import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Layout } from '../components/Layout'
import { ConvertAnonymousPopup } from '../components/ConvertAnonymousPopup'
import { Toaster } from 'sonner'
import { useConvexQuery } from '../lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'
import { useState, useCallback } from 'react'
import { Id } from '../../convex/_generated/dataModel'

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
      <Layout 
        user={profile ? { username: profile.username } : undefined}
        onOpenMessagingWithLobby={onOpenMessagingWithLobby}
      >
        <Outlet />
      </Layout>
      <ConvertAnonymousPopup />
      <Toaster theme="dark" className="rounded-2xl" />
      <TanStackRouterDevtools />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})
