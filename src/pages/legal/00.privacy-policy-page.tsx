import { motion } from 'framer-motion'

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-[60vh] py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-6 text-white/90"
      >
        <h1 className="text-3xl font-display font-semibold">Privacy Policy</h1>
        <p className="text-white/60 text-sm">Last updated: 2025-01-01</p>

        <div className="space-y-4 text-white/80">
          <p>
            We respect your privacy. This page outlines how we handle your data
            when you use Games of the Generals.
          </p>

          <h2 className="text-xl font-semibold mt-6">Who we are</h2>
          <p>
            This service is provided by the team behind Games of the Generals ("we",
            "us"). If you have questions about this policy or your data, please
            contact us using the details at the end of this page.
          </p>

          <h2 className="text-xl font-semibold mt-6">Information we collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account information such as username and email.</li>
            <li>Gameplay data and preferences.</li>
            <li>Device and usage information for performance and security.</li>
            <li>Messaging metadata (time sent, recipient, delivery status).</li>
            <li>Support interactions when you contact us.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">Cookies and local storage</h2>
          <p>
            We use browser storage and cookies to keep you signed in, remember
            preferences, enable push notifications, and improve performance. You
            can control cookies via your browser settings. Disabling them may
            affect some features.
          </p>

          <h2 className="text-xl font-semibold mt-6">Legal bases (EEA/UK)</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Performance of a contract: to create your account and run the game.</li>
            <li>Legitimate interests: to keep the platform secure and reliable.</li>
            <li>Consent: for optional features like notifications.</li>
            <li>Legal obligation: to comply with applicable laws.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">How we use information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide core features such as matchmaking and messaging.</li>
            <li>To maintain security and prevent abuse.</li>
            <li>To improve the experience, debug issues, and analyze performance.</li>
            <li>To send service-related emails or push notifications you enable.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">Sharing and disclosure</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Service providers who help us operate the app (for example, hosting,
              databases, analytics, email delivery, or push notifications). They
              are bound by confidentiality and data protection obligations.
            </li>
            <li>When required by law or to protect the rights and safety of users.</li>
            <li>With your consent or at your direction.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">Data retention</h2>
          <p>
            We keep personal data for as long as necessary to provide the service,
            comply with legal requirements, resolve disputes, and enforce policies.
            Retention periods vary by data type. When data is no longer needed, we
            delete or anonymize it.
          </p>

          <h2 className="text-xl font-semibold mt-6">Security</h2>
          <p>
            We apply technical and organizational measures to protect your data.
            No system is perfectly secure, but we strive to maintain a high level
            of protection against unauthorized access, loss, or misuse.
          </p>

          <h2 className="text-xl font-semibold mt-6">International transfers</h2>
          <p>
            Your data may be processed in countries other than your own. Where
            required, we use safeguards such as contractual protections to help
            ensure your data remains protected.
          </p>

          <h2 className="text-xl font-semibold mt-6">Your rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access, rectify, or delete certain account information.</li>
            <li>Object to or restrict certain processing where applicable.</li>
            <li>Portability of data you provided, where applicable.</li>
            <li>Withdraw consent for optional features at any time.</li>
          </ul>
          <p className="text-white/60">
            Some rights depend on your location and the legal basis used. We may
            need to verify your identity before responding to requests.
          </p>

          <h2 className="text-xl font-semibold mt-6">Children</h2>
          <p>
            The service is intended for general audiences and not directed at
            children under the age required by local law for online services.
          </p>

          <h2 className="text-xl font-semibold mt-6">Changes to this policy</h2>
          <p>
            We may update this policy to reflect changes to the service or legal
            requirements. We will post the updated version here and update the
            "Last updated" date above.
          </p>

          <h2 className="text-xl font-semibold mt-6">Your choices</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Manage notifications and account details in Settings.</li>
            <li>Request data deletion by contacting support.</li>
          </ul>

          <p className="text-white/60 text-sm mt-6">Contact: support@generalsonline.app</p>
        </div>
      </motion.div>
    </div>
  )
}


