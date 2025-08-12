import { motion } from 'framer-motion'

export function TermsAndConditionsPage() {
  return (
    <div className="min-h-[60vh] py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-6 text-white/90"
      >
        <h1 className="text-3xl font-display font-semibold">Terms of Service</h1>
        <p className="text-white/60 text-sm">Last updated: 2025-01-01</p>

        <div className="space-y-4 text-white/80">
          <p>
            By using Generals Online, you agree to these terms. Please read
            them carefully.
          </p>

          <h2 className="text-xl font-semibold mt-6">Eligibility</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must be able to form a binding contract in your jurisdiction.</li>
            <li>If you are under the age required by local law, you need guardian consent.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">Use of service</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Be respectful. Harassment, cheating, or abuse is prohibited.</li>
            <li>Do not attempt to disrupt service or access data you do not own.</li>
            <li>Follow all game rules and fair-play guidelines.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">License and restrictions</h2>
          <p>
            We grant you a limited, non-exclusive, non-transferable license to
            access and use the service for personal, non-commercial purposes,
            subject to these terms.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>No reverse engineering, scraping, or automated extraction.</li>
            <li>No selling, leasing, or sublicensing the service.</li>
            <li>No attempts to bypass security, rate limits, or access controls.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">User content</h2>
          <p>
            You are responsible for the content you create or share (including
            messages, usernames, and avatars). Do not post unlawful, infringing,
            or harmful content. You grant us a license to host and display your
            content for the operation of the service.
          </p>

          <h2 className="text-xl font-semibold mt-6">Accounts</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for keeping your account secure.</li>
            <li>We may suspend accounts that violate these terms.</li>
            <li>Notify us immediately if you suspect unauthorized access.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">Enforcement</h2>
          <p>
            We may review, remove, or restrict access to content or accounts that
            we reasonably believe violate these terms or applicable laws.
          </p>

          <h2 className="text-xl font-semibold mt-6">Termination</h2>
          <p>
            You may stop using the service at any time. We may suspend or terminate
            your access if you violate these terms or where required by law. Upon
            termination, sections intended to survive will remain in effect.
          </p>

          <h2 className="text-xl font-semibold mt-6">Disclaimers</h2>
          <p>
            The service is provided "as is" and "as available" without warranties
            of any kind, express or implied. We do not warrant uninterrupted or
            error-free operation.
          </p>

          <h2 className="text-xl font-semibold mt-6">Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, we will not be liable for any
            indirect, incidental, special, consequential, or punitive damages, or
            any loss of profits or revenues.
          </p>

          <h2 className="text-xl font-semibold mt-6">Changes to the service and terms</h2>
          <p>
            We may update features or these terms from time to time. If changes are
            material, we will take reasonable steps to notify you. Continued use of
            the service after changes means you accept the updated terms.
          </p>

          <h2 className="text-xl font-semibold mt-6">Governing law</h2>
          <p>
            These terms are governed by applicable laws in your place of residence,
            unless a different law is required by your local consumer protection
            regulations.
          </p>

          <p className="text-white/60 text-sm mt-6">Contact: support@generalsonline.app</p>
        </div>
      </motion.div>
    </div>
  )
}


