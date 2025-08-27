import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { SignInForm } from '../auth/SignInForm'
import { SplashScreen } from '../components/SplashScreen'

function AuthComponent() {
  const [showSplash, setShowSplash] = useState(true)

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return <SignInForm />
}

export const Route = createFileRoute('/auth')({
  component: AuthComponent,
})
