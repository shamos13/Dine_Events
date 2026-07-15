'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Signup attempt:', formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-[#CC2622] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">🍽</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Create an account</h1>
          <p className="text-center text-gray-600 mb-8">Join Dine Events to streamline your event management.</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">FULL NAME</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Jane Doe"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622] placeholder-gray-400"
              />
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">BUSINESS NAME</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Jane's Events LLC"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622] placeholder-gray-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">EMAIL ADDRESS</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622] placeholder-gray-400"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622] placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Must be at least 8 characters long.</p>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              className="w-full bg-[#CC2622] text-white font-semibold py-3 rounded-lg hover:bg-[#A01F1A] transition mt-6"
            >
              CREATE ACCOUNT
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Sign In Link */}
          <p className="text-center text-gray-600 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-[#CC2622] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        {/* Icons */}
        <div className="flex justify-center gap-8 mt-12 text-gray-400">
          <span className="text-3xl">🍴</span>
          <span className="text-3xl">🪑</span>
          <span className="text-3xl">🎉</span>
        </div>
      </div>
    </div>
  )
}
