import { createFileRoute } from '@tanstack/react-router'
import { SignInForm } from '../auth/SignInForm'

export const Route = createFileRoute('/auth')({
  component: SignInForm,
})
