import { createFileRoute } from '@tanstack/react-router'
import { PrivacyPolicyPage } from '../pages/legal/00.privacy-policy-page'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPolicyPage,
})


