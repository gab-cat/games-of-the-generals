import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Layout } from '../components/Layout'
import { ConvertAnonymousPopup } from '../components/ConvertAnonymousPopup'
import { Toaster } from 'sonner'
import { useConvexQuery } from '../lib/convex-query-hooks'
import { api } from '../../convex/_generated/api'

function RootComponent() {
  const { data: profile } = useConvexQuery(api.profiles.getCurrentProfile)
  
  return (
    <div className="min-h-screen">
      <Layout user={profile ? { username: profile.username } : undefined}>
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
