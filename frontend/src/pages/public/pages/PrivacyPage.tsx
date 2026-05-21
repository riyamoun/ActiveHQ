export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-20 text-white">
      <h1 className="text-4xl font-bold mb-8">Privacy <span className="text-lime-400">Policy</span></h1>
      <div className="space-y-6 text-white/70 leading-relaxed">
        <p className="text-sm text-white/40">Last updated: May 2026</p>

        <p>
          ActiveHQ ("we", "us") is a gym management platform offered as a web app
          on <span className="text-white">activehq.fit</span> and as native mobile
          apps on Google Play and the Apple App Store. This policy explains what
          we collect, why, and your rights — for both gym owners/staff and gym
          members.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">1. Roles</h2>
        <p>
          <strong className="text-white">Gym owner / staff</strong> use ActiveHQ
          to manage their gym. They are the data controller for their members'
          information.{' '}
          <strong className="text-white">Gym members</strong> use the optional
          member portal (web / mobile) to view their own profile, attendance and
          payments.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">2. Data we collect</h2>
        <p>The following is collected when you or your gym uses ActiveHQ:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-white">Account info:</strong> name, email,
            phone, hashed password, optional TOTP secret (encrypted).
          </li>
          <li>
            <strong className="text-white">Gym details:</strong> business name,
            address, GST number (optional), plans, pricing.
          </li>
          <li>
            <strong className="text-white">Member records:</strong> name, phone,
            optional email, date of birth, gender, address, emergency contact,
            profile photo (uploaded by gym staff), membership dates, payment
            history, attendance check-ins.
          </li>
          <li>
            <strong className="text-white">Biometric metadata:</strong> we store
            a numeric "device user ID" linking a member to your physical eSSL
            biometric device. We do <em>not</em> store the face/fingerprint
            template itself in the cloud — those stay on your device. Face
            images you upload as profile photos are stored only as ordinary
            images.
          </li>
          <li>
            <strong className="text-white">Payment data:</strong> amount, method
            (cash/UPI/card), reference numbers. We do not store full card
            numbers; UPI/bank gateways handle that directly.
          </li>
          <li>
            <strong className="text-white">Device & diagnostic info:</strong>{' '}
            crash reports and performance traces (via Sentry, if enabled). No
            advertising identifiers are collected.
          </li>
          <li>
            <strong className="text-white">Cookies / storage:</strong>{' '}
            JWT auth tokens in browser/native secure storage; analytics
            attribution (UTM) for marketing pages only.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-8">3. How we use it</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Run the gym's operations (memberships, payments, attendance, reports).</li>
          <li>Send service messages by email, SMS or WhatsApp (renewal reminders, OTPs, receipts) — only on the gym owner's behalf.</li>
          <li>Authenticate staff and members securely.</li>
          <li>Detect abuse, debug crashes, improve reliability.</li>
        </ul>
        <p>
          We do <strong className="text-white">not</strong> sell your data,
          share it with advertisers, or use it to train third-party AI models.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">4. Third-party processors</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Render / Vercel — hosting (data in transit + at rest).</li>
          <li>Picky Assist — WhatsApp / SMS delivery (recipient phone, message body).</li>
          <li>Google Identity Services — optional Google sign-in for members.</li>
          <li>Sentry — anonymised crash + performance data (if owner opts in).</li>
          <li>Google Gemini — optional AI coach text generation (BMI/macros only; no names sent).</li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-8">5. Storage & security</h2>
        <p>
          Data is encrypted in transit (TLS) and at rest. Passwords are bcrypt
          hashed. Each gym is tenant-isolated — staff at gym A cannot read gym
          B's data. Backups are retained for 30 days.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">6. Permissions (mobile app)</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-white">Internet:</strong> required to reach the API.</li>
          <li><strong className="text-white">Camera / photos</strong> (optional, only when you tap the photo button): upload member profile photos.</li>
          <li>The app does <strong className="text-white">not</strong> request location, contacts, microphone, calendar, SMS, or background tracking.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-8">7. Children</h2>
        <p>
          ActiveHQ is a business tool. We do not knowingly collect data from
          users under 13. Gyms must obtain parental consent before recording
          minors as members.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">8. Your rights</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Access, correct or export your data (Settings → Profile, or contact us).</li>
          <li>
            Delete your account: see{' '}
            <a className="text-lime-400 hover:text-lime-300" href="/account/delete">
              activehq.fit/account/delete
            </a>{' '}
            or email <a className="text-lime-400 hover:text-lime-300" href="mailto:info@activehq.fit">info@activehq.fit</a>.
          </li>
          <li>Withdraw consent for marketing messages at any time.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-8">9. Retention</h2>
        <p>
          Active account data is retained while your subscription is active.
          After deletion, personal data is purged within 90 days, except where
          retention is required by law (e.g. tax invoices for 7 years).
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">10. Changes</h2>
        <p>
          We may update this policy; material changes are announced in-app and
          on this page. Continued use after the effective date constitutes
          acceptance.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">11. Contact</h2>
        <p>
          Grievance officer / privacy contact:{' '}
          <a href="mailto:info@activehq.fit" className="text-lime-400 hover:text-lime-300">
            info@activehq.fit
          </a>{' '}
          — ActiveHQ, Bangalore, India.
        </p>
      </div>
    </div>
  )
}
