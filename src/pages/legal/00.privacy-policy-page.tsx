import { motion } from 'framer-motion'

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-[60vh] py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-6 text-white/90"
      >
        <h1 className="text-4xl font-display font-semibold">Privacy Policy</h1>
        <p className="text-white/60 text-sm">Last updated: 2026-01-17</p>

        <div className="space-y-6 text-white/90">
          <p className="text-white/80 leading-relaxed">
            This Privacy Policy ("Policy") describes how Generals Online ("we", "us", "our", or the "Service")
            collects, uses, processes, and protects your personal data in compliance with Republic Act No. 10173
            (Data Privacy Act of 2012) and other applicable Philippine laws. By using the Service, you consent
            to the practices described in this Policy.
          </p>

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">Data Protection Officer</h3>
            <p className="text-sm text-blue-200 leading-relaxed">
              <strong>Name:</strong> Gabriel Catimbang<br/>
              <strong>Contact:</strong> dpo@generalsonline.app<br/>
              <strong>Phone:</strong> +63 (931) 028-3773<br/>
              <strong>Address:</strong> Naga City, Philippines
            </p>
            <p className="text-xs text-blue-300/80 mt-2 leading-relaxed">
              The Data Protection Officer is responsible for ensuring compliance with Republic Act No. 10173
              and can be contacted for all privacy-related concerns, complaints, and data subject rights requests.
            </p>
          </div>

          <h2 className="text-xl font-semibold mt-8 text-white">1. Data We Collect</h2>

          <h3 className="text-lg font-medium mt-6 text-white/90">1.1 Personal Data Provided by You</h3>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">Account Information:</strong> Username, email address, password (encrypted), profile information</li>
            <li><strong className="text-white/80">Contact Information:</strong> Email address, phone number (optional)</li>
            <li><strong className="text-white/80">User Content:</strong> Messages, game content, avatars, usernames</li>
            <li><strong className="text-white/80">Support Data:</strong> Communications with our support team, feedback, and reports</li>
          </ul>

          <h3 className="text-lg font-medium mt-6 text-white/90">1.2 Personal Data Collected Automatically</h3>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
            <li><strong className="text-white/80">Usage Data:</strong> Game statistics, login times, feature usage, session duration</li>
            <li><strong className="text-white/80">Location Data:</strong> General location based on IP address (country/city level)</li>
            <li><strong className="text-white/80">Technical Data:</strong> Cookies, local storage, error logs, performance metrics</li>
          </ul>

          <h3 className="text-lg font-medium mt-6 text-white/90">1.3 Personal Data from Third Parties</h3>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">PayMongo:</strong> We use PayMongo to process and verify payments. PayMongo may collect payment method details, contact information, and transaction metadata.</li>
            <li><strong className="text-white/80">Transaction Data:</strong> We receive transaction status, payment IDs, and amounts from PayMongo to activate and manage your subscription.</li>
            <li><strong className="text-white/80">Analytics Services:</strong> Aggregated usage statistics and crash reports.</li>
            <li><strong className="text-white/80">Social Features:</strong> Information from friends or when sharing content.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">2. Legal Basis for Processing (Republic Act No. 10173)</h2>
          <p className="text-white/75 leading-relaxed">We process your personal data based on the following lawful bases:</p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">Consent:</strong> When you explicitly agree to specific processing activities</li>
            <li><strong className="text-white/80">Contractual Necessity:</strong> To provide the Service and fulfill our Terms of Service</li>
            <li><strong className="text-white/80">Legitimate Interests:</strong> To maintain platform security, prevent fraud, and improve services</li>
            <li><strong className="text-white/80">Legal Obligation:</strong> To comply with Philippine laws and regulatory requirements</li>
            <li><strong className="text-white/80">Public Interest:</strong> For cybersecurity and protection of user rights</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">3. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">Service Provision:</strong> Account creation, authentication, and core gaming features</li>
            <li><strong className="text-white/80">Communication:</strong> Direct messaging, game invites, notifications, and support</li>
            <li><strong className="text-white/80">Platform Security:</strong> Fraud prevention, abuse detection, and account protection</li>
            <li><strong className="text-white/80">Service Improvement:</strong> Performance monitoring, bug fixes, and feature development</li>
            <li><strong className="text-white/80">Legal Compliance:</strong> Responding to legal requests and enforcing our Terms</li>
            <li><strong className="text-white/80">Customer Support:</strong> Resolving issues and providing assistance</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">4. Data Sharing and Third-Party Disclosure</h2>

          <h3 className="text-lg font-medium mt-6 text-white/90">4.1 Service Providers</h3>
          <p className="text-white/75 leading-relaxed">We share data with the following categories of service providers:</p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">Hosting Providers:</strong> Cloud infrastructure and data storage services</li>
            <li><strong className="text-white/80">Database Services:</strong> Data management and backup solutions</li>
            <li><strong className="text-white/80">Analytics Services:</strong> Usage analytics and performance monitoring</li>
            <li><strong className="text-white/80">Communication Services:</strong> Email delivery and push notification services</li>
            <li><strong className="text-white/80">Payment Processors:</strong> PayMongo (Payment processing and fraud detection)</li>
          </ul>

          <h3 className="text-lg font-medium mt-6 text-white/90">4.2 Legal Requirements</h3>
          <p className="text-white/75 leading-relaxed">We may disclose personal data when required by law or to protect rights and safety:</p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li>To comply with court orders, subpoenas, or legal processes</li>
            <li>To protect against fraud, security threats, or illegal activities</li>
            <li>To enforce our Terms of Service and protect user rights</li>
            <li>To respond to emergency situations threatening public safety</li>
          </ul>

          <h3 className="text-lg font-medium mt-6 text-white/90">4.3 Third-Party Payment Processing</h3>
          <p className="text-white/75 leading-relaxed">
            When you make a purchase, your payment information (such as credit card numbers or Gcash details) is provided directly to PayMongo.
            We do not store or process sensitive payment credentials on our servers. PayMongo's use of your personal information is governed
            by their Privacy Policy, which can be viewed at <a href="https://www.paymongo.com/privacy" className="underline">paymongo.com/privacy</a>.
          </p>

          <h3 className="text-lg font-medium mt-6 text-white/90">4.4 Business Transfers</h3>
          <p className="text-white/75 leading-relaxed">In the event of a merger, acquisition, or sale of assets, your personal data may be transferred to the new entity, subject to continued compliance with this Policy and Philippine data protection laws.</p>

          <h2 className="text-xl font-semibold mt-8 text-white">5. International Data Transfers</h2>
          <p className="text-white/75 leading-relaxed">
            Your personal data may be transferred to and processed in countries other than the Philippines.
            We ensure appropriate safeguards are in place for international transfers:
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">Standard Contractual Clauses:</strong> EU-approved contractual protections</li>
            <li><strong className="text-white/80">Adequacy Decisions:</strong> Transfers to countries with adequate data protection</li>
            <li><strong className="text-white/80">Binding Corporate Rules:</strong> Internal data protection policies</li>
            <li><strong className="text-white/80">Certification Schemes:</strong> Recognized certification and codes of conduct</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">6. Data Retention and Deletion</h2>

          <h3 className="text-lg font-medium mt-6 text-white/90">6.1 Retention Periods</h3>
          <table className="w-full mt-2 border border-white/20 rounded text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="text-left p-3 border-r border-white/20 text-white/80">Data Type</th>
                <th className="text-left p-3 text-white/80">Retention Period</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/20">
                <td className="p-3 border-r border-white/20 text-white/70">Account Information</td>
                <td className="p-3 text-white/70">Until account deletion or as required by law</td>
              </tr>
              <tr className="border-t border-white/20">
                <td className="p-3 border-r border-white/20 text-white/70">Messages & Communications</td>
                <td className="p-3 text-white/70">7 days from creation (automatic deletion)</td>
              </tr>
              <tr className="border-t border-white/20">
                <td className="p-3 border-r border-white/20 text-white/70">Usage Logs</td>
                <td className="p-3 text-white/70">2 years for security and compliance</td>
              </tr>
              <tr className="border-t border-white/20">
                <td className="p-3 border-r border-white/20 text-white/70">Payment & Transaction Records</td>
                <td className="p-3 text-white/70">7 years (for tax, accounting, and financial compliance)</td>
              </tr>
              <tr className="border-t border-white/20">
                <td className="p-3 border-r border-white/20 text-white/70">Marketing Data</td>
                <td className="p-3 text-white/70">Until consent withdrawal or account deletion</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-lg font-medium mt-6 text-white/90">6.2 Data Deletion Procedures</h3>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">Account Deletion:</strong> Complete data deletion within 30 days of request</li>
            <li><strong className="text-white/80">Automated Deletion:</strong> Messages and temporary data deleted automatically</li>
            <li><strong className="text-white/80">Anonymization:</strong> Data converted to anonymous format when retention required</li>
            <li><strong className="text-white/80">Legal Holds:</strong> Data preserved when required for legal proceedings</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">7. Your Data Subject Rights (Republic Act No. 10173, Section 16)</h2>
          <p className="text-white/75 leading-relaxed">You have the following rights regarding your personal data:</p>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-white/5 rounded border border-white/10">
              <h4 className="font-medium text-green-300 text-sm">Right to Be Informed</h4>
              <p className="text-xs mt-2 text-white/70 leading-relaxed">Receive information about data collection and processing</p>
            </div>
            <div className="p-4 bg-white/5 rounded border border-white/10">
              <h4 className="font-medium text-green-300 text-sm">Right to Access</h4>
              <p className="text-xs mt-2 text-white/70 leading-relaxed">Obtain copies of your personal data we hold</p>
            </div>
            <div className="p-4 bg-white/5 rounded border border-white/10">
              <h4 className="font-medium text-green-300 text-sm">Right to Rectification</h4>
              <p className="text-xs mt-2 text-white/70 leading-relaxed">Correct inaccurate or incomplete personal data</p>
            </div>
            <div className="p-4 bg-white/5 rounded border border-white/10">
              <h4 className="font-medium text-green-300 text-sm">Right to Erasure</h4>
              <p className="text-xs mt-2 text-white/70 leading-relaxed">Request deletion of personal data (right to be forgotten)</p>
            </div>
            <div className="p-4 bg-white/5 rounded border border-white/10">
              <h4 className="font-medium text-green-300 text-sm">Right to Object</h4>
              <p className="text-xs mt-2 text-white/70 leading-relaxed">Object to processing based on legitimate interests</p>
            </div>
            <div className="p-4 bg-white/5 rounded border border-white/10">
              <h4 className="font-medium text-green-300 text-sm">Right to Data Portability</h4>
              <p className="text-xs mt-2 text-white/70 leading-relaxed">Receive data in a structured, machine-readable format</p>
            </div>
          </div>

          <h3 className="text-lg font-medium mt-8 text-white/90">7.1 Exercising Your Rights</h3>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li>Contact our Data Protection Officer at dpo@generalsonline.app</li>
            <li>Provide sufficient information to verify your identity</li>
            <li>Requests processed within 30 days (extendable to 60 days for complex requests)</li>
            <li>Free of charge for reasonable requests; fees may apply for excessive or repetitive requests</li>
            <li>Right to file complaint with the National Privacy Commission if unsatisfied</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">8. Data Breach Notification</h2>
          <p className="text-white/75 leading-relaxed">
            In accordance with Republic Act No. 10173 and NPC guidelines, we will notify affected individuals
            and the National Privacy Commission of any personal data breach within 72 hours of discovery
            if the breach poses a real risk of significant harm to individuals.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">Risk Assessment:</strong> Evaluate breach impact and harm likelihood</li>
            <li><strong className="text-white/80">NPC Notification:</strong> Required for breaches affecting 100+ individuals</li>
            <li><strong className="text-white/80">Individual Notification:</strong> Clear description of breach, potential impact, and mitigation steps</li>
            <li><strong className="text-white/80">Public Communication:</strong> Website notice for widespread breaches</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">9. Security Measures</h2>
          <p className="text-white/75 leading-relaxed">We implement comprehensive security measures to protect your personal data:</p>

          <h3 className="text-lg font-medium mt-6 text-white/90">9.1 Technical Safeguards</h3>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">Encryption:</strong> Data encrypted in transit (TLS 1.3) and at rest</li>
            <li><strong className="text-white/80">Access Controls:</strong> Role-based access and multi-factor authentication</li>
            <li><strong className="text-white/80">Network Security:</strong> Firewalls, intrusion detection, and regular penetration testing</li>
            <li><strong className="text-white/80">Data Backup:</strong> Encrypted backups with secure storage and testing</li>
          </ul>

          <h3 className="text-lg font-medium mt-6 text-white/90">9.2 Organizational Safeguards</h3>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">Staff Training:</strong> Regular data protection and privacy training</li>
            <li><strong className="text-white/80">Policies and Procedures:</strong> Comprehensive data handling policies</li>
            <li><strong className="text-white/80">Incident Response:</strong> Documented breach response and recovery procedures</li>
            <li><strong className="text-white/80">Regular Audits:</strong> Internal and external security assessments</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">10. Children's Privacy</h2>
          <p className="text-white/75 leading-relaxed">
            The Service is intended for users 18 years and older. We do not knowingly collect personal data
            from children under 13. If we become aware of such collection, we will immediately delete the data.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li>Parental consent required for users aged 13-17</li>
            <li>Age verification mechanisms implemented</li>
            <li>Special protections for minors' data under Philippine law</li>
            <li>Parents may request access to their child's data or account deletion</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">11. Cookies and Tracking Technologies</h2>

          <h3 className="text-lg font-medium mt-6 text-white/90">11.1 Types of Cookies Used</h3>
          <table className="w-full mt-2 border border-white/20 rounded text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="text-left p-3 border-r border-white/20 text-white/80">Cookie Type</th>
                <th className="text-left p-3 border-r border-white/20 text-white/80">Purpose</th>
                <th className="text-left p-3 text-white/80">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/20">
                <td className="p-3 border-r border-white/20 text-white/70">Essential Cookies</td>
                <td className="p-3 border-r border-white/20 text-white/70">Authentication and security</td>
                <td className="p-3 text-white/70">Session/30 days</td>
              </tr>
              <tr className="border-t border-white/20">
                <td className="p-3 border-r border-white/20 text-white/70">Performance Cookies</td>
                <td className="p-3 border-r border-white/20 text-white/70">Usage analytics and error tracking</td>
                <td className="p-3 text-white/70">2 years</td>
              </tr>
              <tr className="border-t border-white/20">
                <td className="p-3 border-r border-white/20 text-white/70">Functional Cookies</td>
                <td className="p-3 border-r border-white/20 text-white/70">Preferences and settings</td>
                <td className="p-3 text-white/70">1 year</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-lg font-medium mt-6 text-white/90">11.2 Cookie Management</h3>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li>You can control cookies through your browser settings</li>
            <li>Essential cookies cannot be disabled as they are necessary for the Service</li>
            <li>Opt-out available for non-essential cookies</li>
            <li>Cookie preferences can be managed in your account settings</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">12. Consent and Withdrawal</h2>
          <p className="text-white/75 leading-relaxed">
            Where consent is required for processing, you have the right to withdraw consent at any time.
            Withdrawal will not affect the lawfulness of processing based on consent before withdrawal.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">Marketing Communications:</strong> Opt-in required, easy unsubscribe</li>
            <li><strong className="text-white/80">Optional Features:</strong> Clear consent mechanisms for additional data collection</li>
            <li><strong className="text-white/80">Third-Party Sharing:</strong> Explicit consent for non-essential data sharing</li>
            <li><strong className="text-white/80">Cookies:</strong> Granular consent for different cookie categories</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">13. Automated Decision Making</h2>
          <p className="text-white/75 leading-relaxed">
            We use automated systems for security monitoring, fraud detection, and content moderation.
            These systems do not make solely automated decisions with significant legal effects on individuals.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">Security Systems:</strong> Automated threat detection and account protection</li>
            <li><strong className="text-white/80">Content Moderation:</strong> Automated filtering of prohibited content</li>
            <li><strong className="text-white/80">Anti-Fraud Measures:</strong> Automated detection of suspicious activities</li>
            <li><strong className="text-white/80">Human Oversight:</strong> All automated decisions subject to human review</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 text-white">14. Changes to This Policy</h2>
          <p className="text-white/75 leading-relaxed">
            We may update this Policy to reflect changes in our practices, technology, legal requirements,
            or other factors. Material changes will be notified via email or prominent notice on the Service.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white/80">Notification:</strong> At least 30 days notice for material changes</li>
            <li><strong className="text-white/80">Review:</strong> Updated Policy posted with "Last Updated" date</li>
            <li><strong className="text-white/80">Consent:</strong> Continued use constitutes acceptance of changes</li>
            <li><strong className="text-white/80">Archival:</strong> Previous versions available upon request</li>
          </ul>

          <div className="mt-8 p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
            <h3 className="text-lg font-semibold text-red-300 mb-2">Data Subject Rights Complaint Process</h3>
            <p className="text-sm text-red-200/80 leading-relaxed">
              If you are not satisfied with our response to your data subject rights request, you have the right to file a complaint with:
            </p>
            <p className="text-sm text-red-200/80 mt-2 leading-relaxed">
              <strong>National Privacy Commission</strong><br/>
              Address: 8th Floor, 8 Cybergate Center, N. Domingo St., Capitol Site, Brgy. Poblacion, Makati City 1210<br/>
              Email: privacy.gov.ph<br/>
              Phone: (+632) 982-5563 / 982-5564 / 982-5565<br/>
              Website: <a href="https://privacy.gov.ph" className="underline">privacy.gov.ph</a>
            </p>
          </div>

          <div className="mt-6 p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
            <h3 className="text-lg font-semibold text-green-300 mb-2">Contact Information</h3>
            <p className="text-sm text-green-200/80 leading-relaxed">
              <strong>General Inquiries:</strong> support@generalsonline.app<br/>
              <strong>Data Protection Officer:</strong> dpo@generalsonline.app<br/>
              <strong>Phone:</strong> +63 (931) 028-3773<br/>
              <strong>Address:</strong> Naga City, Philippines<br/>
              <strong>Last Updated:</strong> 2026-01-17
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


