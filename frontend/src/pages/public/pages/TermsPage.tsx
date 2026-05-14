export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-20 text-white">
      <h1 className="text-4xl font-bold mb-8">Terms of <span className="text-lime-400">Service</span></h1>
      <div className="space-y-6 text-white/70 leading-relaxed">
        <p className="text-sm text-white/40">Last updated: April 2026</p>

        <h2 className="text-xl font-semibold text-white mt-8">1. Acceptance of Terms</h2>
        <p>
          By registering for or using ActiveHQ, you agree to these Terms of Service.
          ActiveHQ is a gym management platform provided as a Software-as-a-Service (SaaS).
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">2. Service Description</h2>
        <p>
          ActiveHQ provides gym management tools including member management, membership tracking,
          payment recording, attendance monitoring, reporting, and optional automation features.
          The platform is multi-tenant: each gym's data is isolated and accessible only to
          authorized staff of that gym.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">3. Account Responsibilities</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>You are responsible for maintaining the confidentiality of your login credentials</li>
          <li>You are responsible for all activities under your account</li>
          <li>The gym owner is responsible for managing staff access and permissions</li>
          <li>You agree to provide accurate gym and member information</li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-8">4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use the platform for any unlawful purpose</li>
          <li>Attempt to access data belonging to other gyms</li>
          <li>Reverse-engineer, copy, or redistribute the platform</li>
          <li>Upload malicious content or attempt to compromise system security</li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-8">5. Subscription &amp; Payments</h2>
        <p>
          ActiveHQ offers a 14-day free trial. After the trial, continued use requires an
          active subscription. Subscription fees, billing cycles, and plan details are
          communicated during onboarding and may be updated with 30 days' notice.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">6. Data Ownership</h2>
        <p>
          You retain ownership of all data you enter into ActiveHQ. We do not claim any
          intellectual property rights over your gym or member data. You may export your
          data at any time.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">7. Service Availability</h2>
        <p>
          We aim for high availability but do not guarantee uninterrupted service.
          Scheduled maintenance will be communicated in advance. We are not liable for
          downtime caused by factors outside our control.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">8. Termination</h2>
        <p>
          Either party may terminate the agreement at any time. Upon termination, you will
          have 30 days to export your data before it is permanently deleted.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">9. Contact</h2>
        <p>
          For questions about these terms, contact us at{' '}
          <a href="mailto:info@activehq.fit" className="text-lime-400 hover:text-lime-300">
            info@activehq.fit
          </a>.
        </p>
      </div>
    </div>
  )
}
