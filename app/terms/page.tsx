import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Railroad Arcade',
  description: 'Terms of service for Railroad Arcade - rules and guidelines for using our platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="text-cyan-400 hover:text-cyan-300 mb-8 inline-block"
        >
          &larr; Back to App
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Last updated: December 2025</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Railroad Arcade (&quot;the Service&quot;), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              Railroad Arcade is an interactive web application that allows users to control a model
              railroad remotely, play games, and compete on leaderboards. The Service includes both
              free demo features and paid live mode features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must be at least 13 years old to use this Service</li>
              <li>One person may not maintain more than one account</li>
              <li>
                You are responsible for all activities that occur under your account
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Token System</h2>
            <h3 className="text-lg font-medium text-gray-200 mt-4 mb-2">Purchasing Tokens</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tokens are virtual currency used within the Service</li>
              <li>All token purchases are final and non-refundable</li>
              <li>Tokens have no monetary value outside the Service</li>
              <li>Tokens cannot be transferred between accounts</li>
              <li>We reserve the right to modify token prices</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-200 mt-4 mb-2">Using Tokens</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tokens are consumed when using live mode features</li>
              <li>Token costs for actions are displayed before confirmation</li>
              <li>Consumed tokens cannot be restored</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Tournaments</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tournament entry fees are deducted from your token balance</li>
              <li>Entry fees are non-refundable once registration closes</li>
              <li>Prize distribution is at our discretion</li>
              <li>We reserve the right to disqualify users for cheating or misconduct</li>
              <li>Tournament rules may vary and will be displayed before registration</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Prohibited Conduct</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to cheat, hack, or exploit the system</li>
              <li>Use automated scripts or bots</li>
              <li>Interfere with the operation of the Service</li>
              <li>Harass or abuse other users</li>
              <li>Share account credentials with others</li>
              <li>Attempt to reverse engineer the Service</li>
              <li>Circumvent rate limits or security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by
              Railroad Arcade and are protected by international copyright, trademark, and other
              intellectual property laws. User-generated content (such as usernames and scores) may
              be displayed publicly on leaderboards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              WHETHER EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED,
              SECURE, OR ERROR-FREE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, RAILROAD ARCADE SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
              PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA,
              USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately,
              without prior notice, for any reason, including if you breach these Terms. Upon
              termination, your right to use the Service will immediately cease. Any unused tokens
              will not be refunded upon termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of
              significant changes by posting a notice on the Service. Your continued use of the
              Service after changes indicates acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              State of California, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="mt-2">
              <a
                href="mailto:legal@railroad-arcade.app"
                className="text-cyan-400 hover:text-cyan-300"
              >
                legal@railroad-arcade.app
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Railroad Arcade. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
