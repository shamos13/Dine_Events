'use client'

import AuthFrame from '@/components/AuthFrame'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Login() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionMessage, setSessionMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    keepSignedIn: false,
  })

  useEffect(() => {
    setSessionMessage(new URLSearchParams(window.location.search).get('message'))
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login({ email: formData.email, password: formData.password })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Sign in to access your catering operations dashboard."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-900">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              className="h-12 w-full rounded-lg border border-gray-200 bg-[#F7F8FC] px-4 pl-12 text-base text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-[#CC2622] focus:bg-white focus:ring-2 focus:ring-[#CC2622]/15"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-gray-900">
              Password
            </label>
            <Link href="#" className="text-sm font-semibold text-[#CC2622] transition hover:text-[#A01F1A]">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="h-12 w-full rounded-lg border border-gray-200 bg-[#F7F8FC] px-4 pl-12 pr-12 text-base text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-[#CC2622] focus:bg-white focus:ring-2 focus:ring-[#CC2622]/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="keepSignedIn"
            type="checkbox"
            name="keepSignedIn"
            checked={formData.keepSignedIn}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 accent-[#CC2622]"
          />
          <label htmlFor="keepSignedIn" className="text-sm text-gray-600">
            Keep me signed in
          </label>
        </div>

        {sessionMessage && !error && (
          <p role="status" className="text-sm font-medium text-slate-700">
            {sessionMessage}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-lg bg-[#CC2622] text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#A01F1A] focus:outline-none focus:ring-2 focus:ring-[#CC2622]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="my-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-sm text-gray-500">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <p className="text-center text-base text-gray-600">
        New to Dine Events?{' '}
        <Link href="/signup" className="font-semibold text-[#CC2622] transition hover:text-[#A01F1A]">
          Create an account
        </Link>
      </p>
    </AuthFrame>
  )
}
