import { motion } from "framer-motion";
import { BackToTop, LegalHeader } from "./legal-parts";

const sections = [
  { id: "s1", label: "1. Data we collect" },
  { id: "s2", label: "2. Legal basis for processing (Republic Act No. 10173)" },
  { id: "s3", label: "3. How we use your data" },
  { id: "s4", label: "4. Data sharing and third-party disclosure" },
  { id: "s5", label: "5. International data transfers" },
  { id: "s6", label: "6. Data retention and deletion" },
  {
    id: "s7",
    label: "7. Your data subject rights (Republic Act No. 10173, section 16)",
  },
  { id: "s8", label: "8. Data breach notification" },
  { id: "s9", label: "9. Security measures" },
  { id: "s10", label: "10. Children's privacy" },
  { id: "s11", label: "11. Cookies and tracking technologies" },
  { id: "s12", label: "12. Consent and withdrawal" },
  { id: "s13", label: "13. Automated decision making" },
  { id: "s14", label: "14. Changes to this policy" },
];

export function PrivacyPolicyPage() {
  return (
    <div className="pb-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-[72ch] space-y-6 text-foreground"
      >
        <LegalHeader
          title="Privacy policy"
          updated="2026-01-17"
          sections={sections}
        />

        <div className="space-y-4">
          <p className="text-[15px] leading-7 text-foreground/90">
            This Privacy Policy ("Policy") describes how Generals Online ("we",
            "us", "our", or the "Service") collects, uses, processes, and
            protects your personal data in compliance with Republic Act No.
            10173 (Data Privacy Act of 2012) and other applicable Philippine
            laws. By using the Service, you consent to the practices described
            in this Policy.
          </p>

          <div className="mt-6 rounded-lg border border-border-strong bg-card p-4">
            <h3 className="mb-2 text-base font-semibold text-foreground">
              Data protection officer
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              <strong>Name:</strong> Gabriel Catimbang
              <br />
              <strong>Contact:</strong> dpo@generalsonline.app
              <br />
              <strong>Phone:</strong> +63 (931) 028-3773
              <br />
              <strong>Address:</strong> Naga City, Philippines
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              The Data Protection Officer is responsible for ensuring compliance
              with Republic Act No. 10173 and can be contacted for all
              privacy-related concerns, complaints, and data subject rights
              requests.
            </p>
          </div>

          <h2
            id="s1"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            1. Data we collect
          </h2>

          <h3 className="mt-6 text-base font-semibold text-foreground">
            1.1 Personal data provided by you
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                Account Information:
              </strong>{" "}
              Username, email address, password (encrypted), profile information
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Contact Information:
              </strong>{" "}
              Email address, phone number (optional)
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                User Content:
              </strong>{" "}
              Messages, game content, avatars, usernames
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Support Data:
              </strong>{" "}
              Communications with our support team, feedback, and reports
            </li>
          </ul>

          <h3 className="mt-6 text-base font-semibold text-foreground">
            1.2 Personal data collected automatically
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                Device Information:
              </strong>{" "}
              IP address, browser type, operating system, device identifiers
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Usage Data:
              </strong>{" "}
              Game statistics, login times, feature usage, session duration
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Location Data:
              </strong>{" "}
              General location based on IP address (country/city level)
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Technical Data:
              </strong>{" "}
              Cookies, local storage, error logs, performance metrics
            </li>
          </ul>

          <h3 className="mt-6 text-base font-semibold text-foreground">
            1.3 Personal data from third parties
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                PayMongo:
              </strong>{" "}
              We use PayMongo to process and verify payments. PayMongo may
              collect payment method details, contact information, and
              transaction metadata.
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Transaction Data:
              </strong>{" "}
              We receive transaction status, payment IDs, and amounts from
              PayMongo to activate and manage your subscription.
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Analytics Services:
              </strong>{" "}
              Aggregated usage statistics and crash reports.
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Social Features:
              </strong>{" "}
              Information from friends or when sharing content.
            </li>
          </ul>

          <h2
            id="s2"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            2. Legal basis for processing (Republic Act No. 10173)
          </h2>
          <p className="text-[15px] leading-7 text-foreground/90">
            We process your personal data based on the following lawful bases:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                Consent:
              </strong>{" "}
              When you explicitly agree to specific processing activities
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Contractual Necessity:
              </strong>{" "}
              To provide the Service and fulfill our Terms of Service
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Legitimate Interests:
              </strong>{" "}
              To maintain platform security, prevent fraud, and improve services
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Legal Obligation:
              </strong>{" "}
              To comply with Philippine laws and regulatory requirements
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Public Interest:
              </strong>{" "}
              For cybersecurity and protection of user rights
            </li>
          </ul>

          <h2
            id="s3"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            3. How we use your data
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                Service Provision:
              </strong>{" "}
              Account creation, authentication, and core gaming features
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Communication:
              </strong>{" "}
              Direct messaging, game invites, notifications, and support
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Platform Security:
              </strong>{" "}
              Fraud prevention, abuse detection, and account protection
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Service Improvement:
              </strong>{" "}
              Performance monitoring, bug fixes, and feature development
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Legal Compliance:
              </strong>{" "}
              Responding to legal requests and enforcing our Terms
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Customer Support:
              </strong>{" "}
              Resolving issues and providing assistance
            </li>
          </ul>

          <h2
            id="s4"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            4. Data sharing and third-party disclosure
          </h2>

          <h3 className="mt-6 text-base font-semibold text-foreground">
            4.1 Service providers
          </h3>
          <p className="text-[15px] leading-7 text-foreground/90">
            We share data with the following categories of service providers:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                Hosting Providers:
              </strong>{" "}
              Cloud infrastructure and data storage services
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Database Services:
              </strong>{" "}
              Data management and backup solutions
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Analytics Services:
              </strong>{" "}
              Usage analytics and performance monitoring
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Communication Services:
              </strong>{" "}
              Email delivery and push notification services
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Payment Processors:
              </strong>{" "}
              PayMongo (Payment processing and fraud detection)
            </li>
          </ul>

          <h3 className="mt-6 text-base font-semibold text-foreground">
            4.2 Legal requirements
          </h3>
          <p className="text-[15px] leading-7 text-foreground/90">
            We may disclose personal data when required by law or to protect
            rights and safety:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>To comply with court orders, subpoenas, or legal processes</li>
            <li>
              To protect against fraud, security threats, or illegal activities
            </li>
            <li>To enforce our Terms of Service and protect user rights</li>
            <li>
              To respond to emergency situations threatening public safety
            </li>
          </ul>

          <h3 className="mt-6 text-base font-semibold text-foreground">
            4.3 Third-party payment processing
          </h3>
          <p className="text-[15px] leading-7 text-foreground/90">
            When you make a purchase, your payment information (such as credit
            card numbers or Gcash details) is provided directly to PayMongo. We
            do not store or process sensitive payment credentials on our
            servers. PayMongo's use of your personal information is governed by
            their Privacy Policy, which can be viewed at{" "}
            <a
              href="https://www.paymongo.com/privacy"
              className="text-gold-300 underline underline-offset-4 hover:text-gold-200"
            >
              paymongo.com/privacy
            </a>
            .
          </p>

          <h3 className="mt-6 text-base font-semibold text-foreground">
            4.4 Business transfers
          </h3>
          <p className="text-[15px] leading-7 text-foreground/90">
            In the event of a merger, acquisition, or sale of assets, your
            personal data may be transferred to the new entity, subject to
            continued compliance with this Policy and Philippine data protection
            laws.
          </p>

          <h2
            id="s5"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            5. International data transfers
          </h2>
          <p className="text-[15px] leading-7 text-foreground/90">
            Your personal data may be transferred to and processed in countries
            other than the Philippines. We ensure appropriate safeguards are in
            place for international transfers:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                Standard Contractual Clauses:
              </strong>{" "}
              EU-approved contractual protections
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Adequacy Decisions:
              </strong>{" "}
              Transfers to countries with adequate data protection
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Binding Corporate Rules:
              </strong>{" "}
              Internal data protection policies
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Certification Schemes:
              </strong>{" "}
              Recognized certification and codes of conduct
            </li>
          </ul>

          <h2
            id="s6"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            6. Data retention and deletion
          </h2>

          <h3 className="mt-6 text-base font-semibold text-foreground">
            6.1 Retention periods
          </h3>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full border-collapse text-left text-sm">
              <thead className="bg-white/[0.04]">
                <tr>
                  <th className="border border-border p-3 font-semibold text-foreground">
                    Data Type
                  </th>
                  <th className="border border-border p-3 font-semibold text-foreground">
                    Retention Period
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="">
                  <td className="border border-border p-3 text-foreground/90">
                    Account Information
                  </td>
                  <td className="border border-border p-3 text-foreground/90">
                    Until account deletion or as required by law
                  </td>
                </tr>
                <tr className="">
                  <td className="border border-border p-3 text-foreground/90">
                    Messages & Communications
                  </td>
                  <td className="border border-border p-3 text-foreground/90">
                    7 days from creation (automatic deletion)
                  </td>
                </tr>
                <tr className="">
                  <td className="border border-border p-3 text-foreground/90">
                    Usage Logs
                  </td>
                  <td className="border border-border p-3 text-foreground/90">
                    2 years for security and compliance
                  </td>
                </tr>
                <tr className="">
                  <td className="border border-border p-3 text-foreground/90">
                    Payment & Transaction Records
                  </td>
                  <td className="border border-border p-3 text-foreground/90">
                    7 years (for tax, accounting, and financial compliance)
                  </td>
                </tr>
                <tr className="">
                  <td className="border border-border p-3 text-foreground/90">
                    Marketing Data
                  </td>
                  <td className="border border-border p-3 text-foreground/90">
                    Until consent withdrawal or account deletion
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-6 text-base font-semibold text-foreground">
            6.2 Data deletion procedures
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                Account Deletion:
              </strong>{" "}
              Complete data deletion within 30 days of request
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Automated Deletion:
              </strong>{" "}
              Messages and temporary data deleted automatically
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Anonymization:
              </strong>{" "}
              Data converted to anonymous format when retention required
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Legal Holds:
              </strong>{" "}
              Data preserved when required for legal proceedings
            </li>
          </ul>

          <h2
            id="s7"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            7. Your data subject rights (Republic Act No. 10173, section 16)
          </h2>
          <p className="text-[15px] leading-7 text-foreground/90">
            You have the following rights regarding your personal data:
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-semibold text-foreground">
                Right to be informed
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                Receive information about data collection and processing
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-semibold text-foreground">
                Right to access
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                Obtain copies of your personal data we hold
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-semibold text-foreground">
                Right to rectification
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                Correct inaccurate or incomplete personal data
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-semibold text-foreground">
                Right to erasure
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                Request deletion of personal data (right to be forgotten)
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-semibold text-foreground">
                Right to object
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                Object to processing based on legitimate interests
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-semibold text-foreground">
                Right to data portability
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                Receive data in a structured, machine-readable format
              </p>
            </div>
          </div>

          <h3 className="mt-8 text-base font-semibold text-foreground">
            7.1 Exercising your rights
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              Contact our Data Protection Officer at dpo@generalsonline.app
            </li>
            <li>Provide sufficient information to verify your identity</li>
            <li>
              Requests processed within 30 days (extendable to 60 days for
              complex requests)
            </li>
            <li>
              Free of charge for reasonable requests; fees may apply for
              excessive or repetitive requests
            </li>
            <li>
              Right to file complaint with the National Privacy Commission if
              unsatisfied
            </li>
          </ul>

          <h2
            id="s8"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            8. Data breach notification
          </h2>
          <p className="text-[15px] leading-7 text-foreground/90">
            In accordance with Republic Act No. 10173 and NPC guidelines, we
            will notify affected individuals and the National Privacy Commission
            of any personal data breach within 72 hours of discovery if the
            breach poses a real risk of significant harm to individuals.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                Risk Assessment:
              </strong>{" "}
              Evaluate breach impact and harm likelihood
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                NPC Notification:
              </strong>{" "}
              Required for breaches affecting 100+ individuals
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Individual Notification:
              </strong>{" "}
              Clear description of breach, potential impact, and mitigation
              steps
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Public Communication:
              </strong>{" "}
              Website notice for widespread breaches
            </li>
          </ul>

          <h2
            id="s9"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            9. Security measures
          </h2>
          <p className="text-[15px] leading-7 text-foreground/90">
            We implement comprehensive security measures to protect your
            personal data:
          </p>

          <h3 className="mt-6 text-base font-semibold text-foreground">
            9.1 Technical safeguards
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                Encryption:
              </strong>{" "}
              Data encrypted in transit (TLS 1.3) and at rest
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Access Controls:
              </strong>{" "}
              Role-based access and multi-factor authentication
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Network Security:
              </strong>{" "}
              Firewalls, intrusion detection, and regular penetration testing
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Data Backup:
              </strong>{" "}
              Encrypted backups with secure storage and testing
            </li>
          </ul>

          <h3 className="mt-6 text-base font-semibold text-foreground">
            9.2 Organizational safeguards
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                Staff Training:
              </strong>{" "}
              Regular data protection and privacy training
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Policies and Procedures:
              </strong>{" "}
              Comprehensive data handling policies
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Incident Response:
              </strong>{" "}
              Documented breach response and recovery procedures
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Regular Audits:
              </strong>{" "}
              Internal and external security assessments
            </li>
          </ul>

          <h2
            id="s10"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            10. Children's privacy
          </h2>
          <p className="text-[15px] leading-7 text-foreground/90">
            The Service is intended for users 18 years and older. We do not
            knowingly collect personal data from children under 13. If we become
            aware of such collection, we will immediately delete the data.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>Parental consent required for users aged 13-17</li>
            <li>Age verification mechanisms implemented</li>
            <li>Special protections for minors' data under Philippine law</li>
            <li>
              Parents may request access to their child's data or account
              deletion
            </li>
          </ul>

          <h2
            id="s11"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            11. Cookies and tracking technologies
          </h2>

          <h3 className="mt-6 text-base font-semibold text-foreground">
            11.1 Types of cookies used
          </h3>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full border-collapse text-left text-sm">
              <thead className="bg-white/[0.04]">
                <tr>
                  <th className="border border-border p-3 font-semibold text-foreground">
                    Cookie Type
                  </th>
                  <th className="border border-border p-3 font-semibold text-foreground">
                    Purpose
                  </th>
                  <th className="border border-border p-3 font-semibold text-foreground">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="">
                  <td className="border border-border p-3 text-foreground/90">
                    Essential Cookies
                  </td>
                  <td className="border border-border p-3 text-foreground/90">
                    Authentication and security
                  </td>
                  <td className="border border-border p-3 text-foreground/90">
                    Session/30 days
                  </td>
                </tr>
                <tr className="">
                  <td className="border border-border p-3 text-foreground/90">
                    Performance Cookies
                  </td>
                  <td className="border border-border p-3 text-foreground/90">
                    Usage analytics and error tracking
                  </td>
                  <td className="border border-border p-3 text-foreground/90">
                    2 years
                  </td>
                </tr>
                <tr className="">
                  <td className="border border-border p-3 text-foreground/90">
                    Functional Cookies
                  </td>
                  <td className="border border-border p-3 text-foreground/90">
                    Preferences and settings
                  </td>
                  <td className="border border-border p-3 text-foreground/90">
                    1 year
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-6 text-base font-semibold text-foreground">
            11.2 Cookie management
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>You can control cookies through your browser settings</li>
            <li>
              Essential cookies cannot be disabled as they are necessary for the
              Service
            </li>
            <li>Opt-out available for non-essential cookies</li>
            <li>Cookie preferences can be managed in your account settings</li>
          </ul>

          <h2
            id="s12"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            12. Consent and withdrawal
          </h2>
          <p className="text-[15px] leading-7 text-foreground/90">
            Where consent is required for processing, you have the right to
            withdraw consent at any time. Withdrawal will not affect the
            lawfulness of processing based on consent before withdrawal.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                Marketing Communications:
              </strong>{" "}
              Opt-in required, easy unsubscribe
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Optional Features:
              </strong>{" "}
              Clear consent mechanisms for additional data collection
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Third-Party Sharing:
              </strong>{" "}
              Explicit consent for non-essential data sharing
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Cookies:
              </strong>{" "}
              Granular consent for different cookie categories
            </li>
          </ul>

          <h2
            id="s13"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            13. Automated decision making
          </h2>
          <p className="text-[15px] leading-7 text-foreground/90">
            We use automated systems for security monitoring, fraud detection,
            and content moderation. These systems do not make solely automated
            decisions with significant legal effects on individuals.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                Security Systems:
              </strong>{" "}
              Automated threat detection and account protection
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Content Moderation:
              </strong>{" "}
              Automated filtering of prohibited content
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Anti-Fraud Measures:
              </strong>{" "}
              Automated detection of suspicious activities
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Human Oversight:
              </strong>{" "}
              All automated decisions subject to human review
            </li>
          </ul>

          <h2
            id="s14"
            className="mt-10 scroll-mt-24 border-t border-border pt-6 text-xl font-semibold text-foreground"
          >
            14. Changes to this policy
          </h2>
          <p className="text-[15px] leading-7 text-foreground/90">
            We may update this Policy to reflect changes in our practices,
            technology, legal requirements, or other factors. Material changes
            will be notified via email or prominent notice on the Service.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground/90 marker:text-foreground/50">
            <li>
              <strong className="font-semibold text-foreground">
                Notification:
              </strong>{" "}
              At least 30 days notice for material changes
            </li>
            <li>
              <strong className="font-semibold text-foreground">Review:</strong>{" "}
              Updated Policy posted with "Last Updated" date
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Consent:
              </strong>{" "}
              Continued use constitutes acceptance of changes
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Archival:
              </strong>{" "}
              Previous versions available upon request
            </li>
          </ul>

          <div className="mt-8 rounded-lg border border-border-strong bg-card p-4">
            <h3 className="mb-2 text-base font-semibold text-foreground">
              Data subject rights complaint process
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              If you are not satisfied with our response to your data subject
              rights request, you have the right to file a complaint with:
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              <strong>National Privacy Commission</strong>
              <br />
              Address: 8th Floor, 8 Cybergate Center, N. Domingo St., Capitol
              Site, Brgy. Poblacion, Makati City 1210
              <br />
              Email: privacy.gov.ph
              <br />
              Phone: (+632) 982-5563 / 982-5564 / 982-5565
              <br />
              Website:{" "}
              <a
                href="https://privacy.gov.ph"
                className="text-gold-300 underline underline-offset-4 hover:text-gold-200"
              >
                privacy.gov.ph
              </a>
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-border-strong bg-card p-4">
            <h3 className="mb-2 text-base font-semibold text-foreground">
              Contact information
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              <strong>General Inquiries:</strong> support@generalsonline.app
              <br />
              <strong>Data Protection Officer:</strong> dpo@generalsonline.app
              <br />
              <strong>Phone:</strong> +63 (931) 028-3773
              <br />
              <strong>Address:</strong> Naga City, Philippines
              <br />
              <strong>Last Updated:</strong> 2026-01-17
            </p>
          </div>
        </div>
      </motion.div>
      <BackToTop />
    </div>
  );
}
