'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from '@/app/actions/auth'

const QUERY_ERROR_MESSAGES: Record<string, string> = {
  account_disabled: 'Your account has been disabled. Please contact your manager.',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const queryError = searchParams.get('error')
  const initialError = queryError ? (QUERY_ERROR_MESSAGES[queryError] ?? null) : null

  const [error, setError] = useState<string | null>(initialError)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const result = await signIn(email, password)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Brand header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500 mb-4">
          <span className="text-2xl">🍔</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Dom Cellebre
        </h1>
        <p className="text-stone-400 text-sm mt-1">Staff Portal</p>
      </div>

      {/* Login card */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 p-8 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-stone-300 mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3.5 py-2.5 bg-stone-800 border border-stone-700 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors text-sm"
              placeholder="you@domcellebre.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-300 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3.5 py-2.5 bg-stone-800 border border-stone-700 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-950 border border-red-800 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 disabled:cursor-not-allowed text-stone-950 font-semibold rounded-lg transition-colors text-sm"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      <p className="text-center text-stone-600 text-xs mt-6">
        © {new Date().getFullYear()} Dom Cellebre. Internal use only.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

