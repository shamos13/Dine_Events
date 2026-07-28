'use client'

import AuthFrame from '@/components/AuthFrame'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { Building2, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function Signup() {
  const { register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
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
      await register(formData)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFrame
      title="Create an account"
      subtitle="Join Dine Events to streamline event planning, billing, staffing, and service."
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
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Jane Doe"
              className="h-12 w-full rounded-lg border border-gray-200 bg-[#F7F8FC] px-4 pl-12 text-base text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-[#CC2622] focus:bg-white focus:ring-2 focus:ring-[#CC2622]/15"
            />
          </div>
        </div>

        <div>
          <label htmlFor="businessName" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-900">
            Business name
          </label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="businessName"
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Jane's Events LLC"
              className="h-12 w-full rounded-lg border border-gray-200 bg-[#F7F8FC] px-4 pl-12 text-base text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-[#CC2622] focus:bg-white focus:ring-2 focus:ring-[#CC2622]/15"
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
              value={formData.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              className="h-12 w-full rounded-lg border border-gray-200 bg-[#F7F8FC] px-4 pl-12 text-base text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-[#CC2622] focus:bg-white focus:ring-2 focus:ring-[#CC2622]/15"
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
          className="h-12 w-full rounded-lg bg-[#CC2622] text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#A01F1A] focus:outline-none focus:ring-2 focus:ring-[#CC2622]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
        <Link href="/login" className="font-semibold text-[#CC2622] transition hover:text-[#A01F1A]">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  )
}