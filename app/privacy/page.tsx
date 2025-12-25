import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Railroad Arcade',
  description: 'Privacy policy for Railroad Arcade - how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="text-cyan-400 hover:text-cyan-300 mb-8 inline-block"
        >
          &larr; Back to App
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: December 2025</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Railroad Arcade (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you use our application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-200 mt-4 mb-2">Account Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address (for account creation and login)</li>
              <li>Username/display name</li>
              <li>Password (securely hashed, never stored in plain text)</li>
              <li>OAuth profile data (if signing in with Google or GitHub)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-200 mt-4 mb-2">Usage Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Game sessions and scores</li>
              <li>Achievements earned</li>
              <li>Token transactions</li>
              <li>Session history and statistics</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-200 mt-4 mb-2">Technical Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address (for security and rate limiting)</li>
              <li>Device type and browser information</li>
              <li>Session cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain the service</li>
              <li>To process token purchases and transactions</li>
              <li>To display leaderboards and rankings</li>
              <li>To track achievements and progress</li>
              <li>To prevent fraud and abuse</li>
              <li>To improve our application</li>
              <li>To communicate with you about your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Sharing</h2>
            <p className="mb-3">We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Payment processors</strong> (Stripe, PayPal, Coinbase) - to process
                transactions
              </li>
              <li>
                <strong>Analytics services</strong> - to improve the application (anonymized data
                only)
              </li>
              <li>
                <strong>Law enforcement</strong> - when required by law
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Security</h2>
            <p>We implement appropriate security measures including:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Password hashing using bcrypt</li>
              <li>HTTPS encryption for all data transmission</li>
              <li>Rate limiting to prevent abuse</li>
              <li>Secure session management</li>
              <li>Regular security audits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. These cookies are
              necessary for the application to function. We do not use tracking cookies for
              advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Children&apos;s Privacy</h2>
            <p>
              Railroad Arcade is not intended for children under 13. We do not knowingly collect
              information from children under 13. If you believe we have collected such information,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you delete your account,
              we will delete your personal information within 30 days, except where we are required
              to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or your data, please contact us at:
            </p>
            <p className="mt-2">
              <a
                href="mailto:privacy@railroad-arcade.app"
                className="text-cyan-400 hover:text-cyan-300"
              >
                privacy@railroad-arcade.app
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
