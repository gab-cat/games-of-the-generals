import { motion } from 'framer-motion'

export function TermsAndConditionsPage() {
  return (
    <div className="min-h-[60vh] py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-6 text-white/90"
      >
        <h1 className="text-4xl font-display font-semibold">Terms of Service</h1>
        <p className="text-white/60 text-sm">Last updated: 2026-01-17</p>

        <div className="space-y-6 text-white/90">
          <p className="text-white/80 leading-relaxed">
            By using Generals Online ("Service"), you agree to these Terms of Service ("Terms"). Please read
            them carefully. These Terms constitute a legally binding agreement between you and the Service provider.
          </p>

          <h2 className="text-xl font-semibold mt-8 text-white">1. Eligibility and Age Restrictions</h2>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li>You must be at least 18 years old or have obtained parental/guardian consent to use this Service.</li>
            <li>Users under 13 years old are strictly prohibited from using the Service.</li>
            <li>You must have the legal capacity to enter into binding contracts in the Republic of the Philippines.</li>
            <li>By using the Service, you represent and warrant that you meet these eligibility requirements.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">2. Service Description and License</h2>
          <p className="text-white/75 leading-relaxed">
            We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service
            for personal, non-commercial purposes only, subject to these Terms and applicable Philippine law.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li>The Service includes online multiplayer gaming, messaging, and related features.</li>
            <li>License is granted solely for lawful purposes and in compliance with Republic Act No. 10175 (Cybercrime Prevention Act of 2012).</li>
            <li>No reverse engineering, decompiling, disassembling, or attempting to derive source code.</li>
            <li>No automated access, scraping, or data extraction without express written permission.</li>
            <li>No modification, adaptation, or creation of derivative works of the Service.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">3. Prohibited Activities and Cybercrime Compliance</h2>
          <p className="text-white/75 leading-relaxed">
            You agree not to engage in any activities that violate these Terms or applicable Philippine laws,
            including but not limited to Republic Act No. 10175 (Cybercrime Prevention Act of 2012).
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li><strong className="text-white/80">Unauthorized Access:</strong> No illegal access to computer systems, networks, or data (Section 4, RA 10175).</li>
            <li><strong className="text-white/80">Data Interference:</strong> No unauthorized alteration, damage, or deletion of data (Section 4, RA 10175).</li>
            <li><strong className="text-white/80">System Interference:</strong> No transmission of viruses, malware, or harmful code (Section 4, RA 10175).</li>
            <li><strong className="text-white/80">Computer-related Fraud:</strong> No fraudulent activities using computers or networks (Section 4, RA 10175).</li>
            <li><strong className="text-white/80">Identity Theft:</strong> No unauthorized use of another person's identity or credentials (Section 4, RA 10175).</li>
            <li><strong className="text-white/80">Harassment and Abuse:</strong> No cyberbullying, threats, or harassment of other users.</li>
            <li><strong className="text-white/80">Cheating:</strong> No exploitation of game mechanics, bots, or unfair advantages.</li>
            <li><strong className="text-white/80">Content Violations:</strong> No posting unlawful, infringing, defamatory, or harmful content.</li>
          </ul>
          <p className="text-red-300/80 font-medium text-sm leading-relaxed mt-4">
            Violation of these provisions may result in account suspension, termination, and potential criminal prosecution under Philippine law.
          </p>

          <h2 className="text-xl font-semibold mt-8 text-white">4. User Content and Intellectual Property</h2>
          <p className="text-white/75 leading-relaxed">
            You retain ownership of content you create or upload ("User Content"). However, by posting User Content,
            you grant us a perpetual, irrevocable, worldwide, royalty-free license to use, display, reproduce,
            modify, and distribute your User Content in connection with the Service.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li>You are solely responsible for your User Content and its compliance with Philippine laws.</li>
            <li>You warrant that you have all necessary rights to grant the licenses specified herein.</li>
            <li>We reserve the right to remove, restrict, or moderate User Content that violates these Terms.</li>
            <li>The Service and all intellectual property rights therein are owned by us and protected by Philippine law.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">5. Message Retention and Data Management</h2>
          <p className="text-white/75 leading-relaxed">
            By using messaging features, you acknowledge that messages are automatically deleted after 7 days.
            This limitation is a fundamental aspect of the Service design and data minimization principles under
            Republic Act No. 10173 (Data Privacy Act of 2012).
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li>Messages are not permanently stored and cannot be recovered after deletion.</li>
            <li>Important information must be preserved externally if retention beyond 7 days is required.</li>
            <li>This policy applies to all message types including direct messages, game invites, and attachments.</li>
            <li>Data retention complies with proportionality and data minimization principles.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">6. Account Security and Responsibility</h2>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li>You are responsible for maintaining account security and all activities under your account.</li>
            <li>You must immediately notify us of any unauthorized access or security breaches.</li>
            <li>We may suspend or terminate accounts that violate these Terms or applicable laws.</li>
            <li>Account sharing or transfer is prohibited without express written consent.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">7. Service Availability and Modifications</h2>
          <p className="text-white/75 leading-relaxed">
            We reserve the right to modify, suspend, or discontinue the Service at any time for any reason,
            with reasonable notice where practicable.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li>Service availability is not guaranteed and may be affected by maintenance, updates, or technical issues.</li>
            <li>We may implement rate limits, usage restrictions, or feature limitations.</li>
            <li>Changes to these Terms will be effective upon posting, with continued use constituting acceptance.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">8. Disclaimers of Warranties</h2>
          <p className="text-white/90 font-medium text-sm leading-relaxed">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND,
            EXPRESS OR IMPLIED, TO THE FULLEST EXTENT PERMITTED BY PHILIPPINE LAW.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li>No warranty of merchantability, fitness for particular purpose, or non-infringement.</li>
            <li>No warranty of uninterrupted, secure, or error-free operation.</li>
            <li>No warranty regarding accuracy, reliability, or completeness of content.</li>
            <li>No warranty that the Service will meet your requirements or expectations.</li>
            <li>No warranty regarding third-party content, services, or integrations.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">9. Limitation of Liability</h2>
          <p className="text-white/90 font-medium text-sm leading-relaxed">
            TO THE FULLEST EXTENT PERMITTED BY PHILIPPINE LAW (REPUBLIC ACT NO. 7394, CONSUMER ACT OF THE PHILIPPINES),
            WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
            INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li>Maximum liability limited to the amount paid by you for the Service in the 12 months preceding the claim.</li>
            <li>No liability for any damages exceeding PHP 100,000.00 (One Hundred Thousand Philippine Pesos).</li>
            <li>Liability exclusions apply even if we have been advised of the possibility of such damages.</li>
            <li>This limitation applies to all claims, whether based in contract, tort, or otherwise.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">10. Indemnification</h2>
          <p className="text-white/75 leading-relaxed">
            You agree to indemnify, defend, and hold harmless the Service, its officers, directors, employees,
            and agents from and against any claims, demands, liabilities, damages, losses, costs, and expenses
            (including reasonable attorneys' fees) arising out of or related to:
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li>Your violation of these Terms or applicable Philippine laws.</li>
            <li>Your use of the Service or User Content.</li>
            <li>Your violation of any third-party rights, including intellectual property rights.</li>
            <li>Any claim that your User Content caused damage to a third party.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">11. Payments and Subscriptions</h2>
          <p className="text-white/75 leading-relaxed">
            The Service offers paid subscription tiers ("Pro" and "Pro+") and donation options to support platform development.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li><strong className="text-white/80">Subscription Tiers:</strong> "Pro" at ₱99.00/month and "Pro+" at ₱199.00/month.</li>
            <li><strong className="text-white/80">Prepaid Model:</strong> Subscriptions are prepaid for one or more months. We offer progressive discounts for multi-month purchases (3, 6, or 12 months).</li>
            <li><strong className="text-white/80">Payment Processing:</strong> All payments are processed through PayMongo, a secure third-party payment gateway. We support QR PH and other Philippine-standard payment methods.</li>
            <li><strong className="text-white/80">Expiry and Grace Period:</strong> Subscriptions expire at the end of the prepaid period. We provide a 48-hour grace period before access to premium features is restricted.</li>
            <li><strong className="text-white/80">No Automatic Billing:</strong> We do not store your payment credentials or perform automatic recurring billing. Users must manually renew their subscriptions.</li>
            <li><strong className="text-white/80">Refund Policy:</strong> In accordance with Philippine law for digital services, all payments are non-refundable once the service has been accessed or the subscription activated.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">12. Termination</h2>
          <p className="text-white/75 leading-relaxed">
            Either party may terminate this agreement at any time. We may terminate or suspend your access
            immediately, without prior notice, for violations of these Terms or applicable law.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li>Upon termination, your right to use the Service ceases immediately.</li>
            <li>We may delete your account and associated data in accordance with our Privacy Policy.</li>
            <li>Sections 8, 9, 10, 11, 13, 14, and 15 survive termination.</li>
            <li>No refunds will be provided for prepaid subscription time in the event of account termination for violations.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">13. Force Majeure</h2>
          <p className="text-white/75 leading-relaxed">
            We shall not be liable for any delay or failure to perform our obligations under these Terms
            if such delay or failure is caused by events beyond our reasonable control, including but not limited to:
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li>Natural disasters, earthquakes, floods, or other acts of God.</li>
            <li>War, terrorism, civil unrest, or government actions.</li>
            <li>Internet outages, cyberattacks, or third-party service failures.</li>
            <li>Pandemics, epidemics, or public health emergencies.</li>
            <li>Any other force majeure events recognized under Philippine law.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">14. Governing Law and Dispute Resolution</h2>
          <p className="text-white/90 font-medium text-sm leading-relaxed">
            These Terms are governed by and construed in accordance with the laws of the Republic of the Philippines,
            specifically Republic Act No. 10173 (Data Privacy Act), Republic Act No. 10175 (Cybercrime Prevention Act),
            Republic Act No. 7394 (Consumer Act of the Philippines), and Republic Act No. 8792 (Electronic Commerce Act).
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li><strong className="text-white/80">Jurisdiction:</strong> Exclusive jurisdiction lies with the courts of Metro Manila, Philippines.</li>
            <li><strong className="text-white/80">Dispute Resolution:</strong> Parties agree to first attempt resolution through good faith negotiation.</li>
            <li><strong className="text-white/80">Mediation:</strong> If negotiation fails, disputes shall be submitted to mediation under Philippine Alternative Dispute Resolution Act.</li>
            <li><strong className="text-white/80">Arbitration:</strong> Unresolved disputes may be submitted to arbitration in accordance with Philippine Arbitration Law.</li>
            <li><strong className="text-white/80">Class Action Waiver:</strong> You agree to resolve disputes individually and waive any right to participate in class actions.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">15. Consumer Rights and Remedies</h2>
          <p className="text-white/75 leading-relaxed">
            In accordance with Republic Act No. 7394 (Consumer Act of the Philippines), you may be entitled to certain consumer protections:
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li>Right to fair and honest dealing in the provision of services.</li>
            <li>Right to protection against deceptive, unfair, and unconscionable sales acts.</li>
            <li>Right to file complaints with the Department of Trade and Industry (DTI) Consumer Protection Council.</li>
            <li>Access to consumer arbitration and mediation services.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">15. Miscellaneous Provisions</h2>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/65 leading-relaxed">
            <li><strong className="text-white/80">Severability:</strong> If any provision is held invalid, the remaining provisions remain in effect.</li>
            <li><strong className="text-white/80">Waiver:</strong> Failure to enforce any provision does not constitute waiver of future enforcement.</li>
            <li><strong className="text-white/80">Entire Agreement:</strong> These Terms constitute the entire agreement between parties.</li>
            <li><strong className="text-white/80">Assignment:</strong> You may not assign rights without written consent; we may assign rights freely.</li>
            <li><strong className="text-white/80">Notices:</strong> Legal notices shall be in writing and delivered to support@generalsonline.app.</li>
          </ul>

          <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-300 mb-2">Important Legal Notice</h3>
            <p className="text-sm text-yellow-200">
              These Terms incorporate Philippine legal requirements and are designed to comply with Republic Act No. 10173 (Data Privacy Act of 2012),
              Republic Act No. 10175 (Cybercrime Prevention Act of 2012), and Republic Act No. 7394 (Consumer Act of the Philippines).
              Violation of these Terms may result in account suspension, termination, and potential legal action under Philippine law.
            </p>
          </div>

          <p className="text-white/60 text-sm mt-6">
            <strong>Contact:</strong> support@generalsonline.app<br/>
            <strong>Data Protection Officer:</strong> dpo@generalsonline.app<br/>
            <strong>Last Updated:</strong> January 17, 2026
          </p>
        </div>
      </motion.div>
    </div>
  )
}


