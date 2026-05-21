import { useState } from 'react'

const SUPPORT_EMAIL = 'info@activehq.fit'

export function AccountDeletePage() {
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')

  const mailtoHref = (() => {
    const subject = encodeURIComponent('Delete my ActiveHQ account')
    const body = encodeURIComponent(
      [
        'Hi ActiveHQ support,',
        '',
        'Please delete my ActiveHQ account and all associated data.',
        '',
        `Account email: ${email || '(please fill in)'}`,
        `Reason (optional): ${reason || '-'}`,
        '',
        'I understand this is permanent and that retention may apply for legally',
        'required records (tax invoices etc.).',
        '',
        'Thanks,',
      ].join('\n'),
    )
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
  })()

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-20 text-white">
      <h1 className="text-4xl font-bold mb-4">
        Delete your <span className="text-lime-400">account</span>
      </h1>
      <p className="text-white/60 mb-10">
        This page explains how to permanently delete your ActiveHQ account and
        the data associated with it.
      </p>

      <div className="space-y-10 text-white/80 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Option 1 — From the app</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Log in to ActiveHQ (web or mobile).</li>
            <li>
              Go to <span className="text-white">Settings → Profile</span>.
            </li>
            <li>
              Tap <span className="text-white">Delete my account</span> and
              confirm. We email a verification link to your registered address.
            </li>
            <li>Click the link within 24 hours to confirm.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Option 2 — By email</h2>
          <p>
            Send a request from your registered email to{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-lime-400 hover:text-lime-300"
            >
              {SUPPORT_EMAIL}
            </a>
            . Or use this form to draft the message:
          </p>
          <div className="grid sm:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <label className="text-sm text-white/70 sm:col-span-2">
              Account email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-lime-500/50"
              />
            </label>
            <label className="text-sm text-white/70 sm:col-span-2">
              Reason (optional)
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Helps us improve — not required."
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-lime-500/50"
              />
            </label>
            <a
              href={mailtoHref}
              className="inline-flex items-center justify-center rounded-xl bg-lime-500 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-lime-400 transition-colors sm:col-span-2"
            >
              Open email draft
            </a>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">What gets deleted</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your owner / staff / member profile and login credentials.</li>
            <li>
              For gym owners: your gym record, members, memberships, payments,
              attendance, biometric mappings, and uploaded photos.
            </li>
            <li>Refresh tokens and any pending OTP / magic-link records.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">What we may keep</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Tax invoices and financial transaction logs — retained for up to
              7 years where required by Indian tax law.
            </li>
            <li>
              Anonymised, aggregated usage metrics that no longer identify you.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Timeline</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Verification: within 24 hours of your request.</li>
            <li>Hard delete: within 90 days of verification.</li>
            <li>Backups: rotated out within 30 days after hard delete.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Questions</h2>
          <p>
            Email{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-lime-400 hover:text-lime-300"
            >
              {SUPPORT_EMAIL}
            </a>{' '}
            and we'll respond within 2 business days.
          </p>
        </section>
      </div>
    </div>
  )
}
