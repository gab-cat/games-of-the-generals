import { createFileRoute } from '@tanstack/react-router'
import { TermsAndConditionsPage } from '../pages/legal/00.terms-and-conditions-page'

export const Route = createFileRoute('/terms')({
  component: TermsAndConditionsPage,
})

