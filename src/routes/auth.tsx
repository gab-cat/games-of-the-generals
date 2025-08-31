import { createFileRoute } from '@tanstack/react-router'
import { useState, lazy, Suspense } from 'react'

// Lazy load auth components for better code splitting
const SignInForm = lazy(() => import('../auth/SignInForm').then(module => ({ default: module.SignInForm })))
const SplashScreen = lazy(() => import('../components/SplashScreen').then(module => ({ default: module.SplashScreen })))

function AuthComponent() {
  const [showSplash, setShowSplash] = useState(true)

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  if (showSplash) {
    return (
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
          </div>
        }
      >
        <SplashScreen onComplete={handleSplashComplete} />
      </Suspense>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  )
}

export const Route = createFileRoute('/auth')({
  component: AuthComponent,
})
