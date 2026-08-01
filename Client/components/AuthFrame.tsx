'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, ChefHat, ClipboardCheck, Utensils } from 'lucide-react'

type AuthFrameProps = {
  title: string
  subtitle: string
  children: React.ReactNode
}

export default function AuthFrame({ title, subtitle, children }: AuthFrameProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F6F7FB] text-gray-900">
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full max-w-[480px]" aria-labelledby="auth-heading">
          <div className="mb-4 flex justify-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#CC2622]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>
          </div>

          <div className="mb-6 flex justify-center">
            <Link
              href="/"
              aria-label="Dine Events home"
              className="flex h-[88px] w-[88px] items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <Image
                src="/dine-events-logo.png"
                alt="Dine Events"
                width={108}
                height={36}
                priority
                className="h-auto w-[72px] object-contain"
              />
            </Link>
          </div>

          <div className="mb-7 text-center">
            <h1 id="auth-heading" className="text-3xl font-bold tracking-normal text-gray-950">
              {title}
            </h1>
            <p className="mt-3 text-base leading-6 text-gray-600">{subtitle}</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            {children}
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-gray-300">
            <Utensils className="h-10 w-10" aria-hidden="true" />
            <ClipboardCheck className="h-10 w-10" aria-hidden="true" />
            <CalendarDays className="h-10 w-10" aria-hidden="true" />
            <ChefHat className="h-10 w-10" aria-hidden="true" />
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-[#F6F7FB] px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xl font-bold text-[#CC2622]">Dine Events</span>
            <span>© 2026 Dine Events. All rights reserved.</span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-8 gap-y-2" aria-label="Auth footer">
            <Link href="#" className="transition hover:text-[#CC2622]">
              Privacy Policy
            </Link>
            <Link href="#" className="transition hover:text-[#CC2622]">
              Terms of Service
            </Link>
            <Link href="#" className="transition hover:text-[#CC2622]">
              Support
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
