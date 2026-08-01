'use client'

import AuthFrame from '@/components/AuthFrame'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { Building2, Eye, EyeOff, Lock, Mail, Phone, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function Signup() {
  const { register, user, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
    password: '',
  })

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        companyName: formData.companyName || undefined,
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submitting this form replaces whatever session is active, so an admin who lands
  // here to onboard a customer would be signed out into that customer's portal.
  if (!isLoading && user?.role === 'ADMIN') {
    return (
      <AuthFrame
        title="You're signed in as an operator"
        subtitle="This form creates a new client account and would sign you out of your admin session."
      >
        <div className="space-y-4">
          <p className="text-base text-gray-600">
            To onboard a customer, use <span className="font-semibold text-gray-900">Add Client</span> on the Clients
            page. That keeps you signed in, and the customer can later register here with the same email to claim their
            portal access.
          </p>
          <Link
            href="/crm"
            className="flex h-12 w-full items-center justify-center rounded-lg bg-brand text-sm font-bold uppercase tracking-wide text-white transition hover:bg-brand-dark"
          >
            Go to Clients
          </Link>
        </div>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame
      title="Create your client account"
      subtitle="Plan events, review quotations, and pay invoices with M-Pesa — all in one portal."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-900">
            Full name
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="fullName"
              type="text"
              name="fullName"
              autoComplete="name"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Sarah Jenkins"
              className="h-12 w-full rounded-lg border border-gray-200 bg-[#F7F8FC] px-4 pl-12 text-base text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/15"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-900">
            Phone (M-Pesa)
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="phone"
              type="tel"
              name="phone"
              autoComplete="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="07XXXXXXXX"
              className="h-12 w-full rounded-lg border border-gray-200 bg-[#F7F8FC] px-4 pl-12 text-base text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/15"
            />
          </div>
        </div>

        <div>
          <label htmlFor="companyName" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-900">
            Company / organization <span className="font-normal normal-case text-gray-400">(optional)</span>
          </label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="companyName"
              type="text"
              name="companyName"
              autoComplete="organization"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Jenkins Family"
              className="h-12 w-full rounded-lg border border-gray-200 bg-[#F7F8FC] px-4 pl-12 text-base text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/15"
            />
          </div>
        </div>

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
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="sarah@example.com"
              className="h-12 w-full rounded-lg border border-gray-200 bg-[#F7F8FC] px-4 pl-12 text-base text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/15"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-900">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="h-12 w-full rounded-lg border border-gray-200 bg-[#F7F8FC] px-4 pl-12 pr-12 text-base text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/15"
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
          <p className="mt-2 text-sm text-gray-500">Must be at least 8 characters long.</p>
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-lg bg-brand text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="my-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-sm text-gray-500">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <p className="text-center text-base text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand transition hover:text-brand-dark">
          Sign in
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-gray-500">
        Staff / operators: ask an admin to create your account, then{' '}
        <Link href="/login" className="font-semibold text-brand">
          sign in
        </Link>
        .
      </p>
    </AuthFrame>
  )
}
