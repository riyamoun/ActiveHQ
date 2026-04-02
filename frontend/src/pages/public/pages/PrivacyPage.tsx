export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-20">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
        <p className="text-sm text-slate-400">Last updated: April 2026</p>

        <h2 className="text-xl font-semibold text-slate-800 mt-8">1. Information We Collect</h2>
        <p>
          ActiveHQ collects information you provide when registering your gym, adding members,
          and using our platform. This includes gym details, staff accounts, member profiles,
          attendance records, payment data, and membership information.
        </p>

        <h2 className="text-xl font-semibold text-slate-800 mt-8">2. How We Use Your Information</h2>
        <p>We use the information to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide and maintain the ActiveHQ platform</li>
          <li>Process gym management operations (memberships, payments, attendance)</li>
          <li>Send service-related notifications and updates</li>
          <li>Improve our platform and develop new features</li>
          <li>Provide customer support</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-800 mt-8">3. Data Security</h2>
        <p>
          We implement industry-standard security measures including encrypted data transmission
          (TLS/SSL), hashed passwords, JWT-based authentication, and tenant-isolated data storage.
          Each gym's data is strictly separated from other gyms on our platform.
        </p>

        <h2 className="text-xl font-semibold text-slate-800 mt-8">4. Data Sharing</h2>
        <p>
          We do not sell or share your personal data with third parties for marketing purposes.
          Data may be shared with service providers (hosting, email) strictly for operating our
          platform, and with law enforcement when legally required.
        </p>

        <h2 className="text-xl font-semibold text-slate-800 mt-8">5. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. Upon account deletion,
          we remove personal data within 90 days, except where retention is required by law
          (e.g., financial records).
        </p>

        <h2 className="text-xl font-semibold text-slate-800 mt-8">6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Access your data stored on ActiveHQ</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your account and data</li>
          <li>Export your data in standard formats</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-800 mt-8">7. Contact</h2>
        <p>
          For privacy-related inquiries, contact us at{' '}
          <a href="mailto:hello@activehq.in" className="text-emerald-600 hover:text-emerald-500">
            hello@activehq.in
          </a>.
        </p>
      </div>
    </div>
  )
}
