import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInForm } from '../auth/SignInForm'
import { AIGamePage } from '../pages/ai-game/00.ai-game-page'

export const Route = createFileRoute('/ai-game')({
  component: AIGameRoute,
})

function AIGameRoute() {
  return (
    <>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        <AIGamePage />
      </Authenticated>
    </>
  )
}
