import Image from 'next/image'
import Link from 'next/link'
import {
  Boxes,
  CalendarDays,
  ChefHat,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'

const modules = [
  {
    title: 'Event Management',
    body: 'Logistics, staff scheduling, and billing cycles in one command surface.',
    tags: ['LOGISTICS', 'STAFFING'],
    icon: ClipboardList,
    dark: false,
  },
  {
    title: 'Financial Precision',
    body: 'Native KRA-aware localization with real-time P&L tracking for Kenyan caterers.',
    metric: 'KSh 1.2M AVG. MONTHLY FLOW',
    icon: Wallet,
    dark: true,
  },
  {
    title: 'Visual Scheduler',
    body: 'Bird’s-eye orchestration for venues, equipment, and crews.',
    tags: ['DRAG & DROP'],
    icon: CalendarDays,
    dark: false,
  },
  {
    title: 'Menu Catalog',
    body: 'Curated Kenyan dish libraries with package-level pricing.',
    tags: ['BUFFET', 'PLATED'],
    icon: UtensilsCrossed,
    dark: false,
  },
  {
    title: 'Rental Tracking',
    body: 'Real-time inventory status for chafers, linen, and décor assets.',
    tags: ['INVENTORY'],
    icon: Boxes,
    dark: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo_dine.png" alt="Dine Events" width={36} height={36} className="rounded-full" />
            <span className="text-sm font-bold tracking-wide">DINE EVENTS</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <a href="#solutions" className="hover:text-brand">Solutions</a>
            <a href="#features" className="hover:text-brand">Features</a>
            <a href="#stories" className="hover:text-brand">Success Stories</a>
          </nav>
          <Link
            href="/signup"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Get Started
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-navy text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url('/screens/dashboard.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/85 to-navy" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-brand-light" /> The Crimson Suite
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            Catering Operations,{' '}
            <span className="font-serif italic text-brand-light">Redefined.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-white/75 sm:text-lg">
            A high-performance management suite engineered for professional caterers — plus a client portal so your guests can curate, approve, and pay for unforgettable events.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              Request a Private Demo
            </Link>
            <a
              href="#solutions"
              className="rounded-lg border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-[#F8F9FB] py-8">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Trusted by Kenya&apos;s top culinary teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-semibold text-slate-400">
            {['Safari Clubs', 'Elite Plate', 'Urban Kitchen', 'Nova Events'].map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="solutions" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">The Crimson Suite</h2>
          <p className="mt-3 text-slate-600">
            Five operational modules that keep kitchens, crews, and cashflow in sync — designed in Nairobi, ready for every catering house.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <article
              key={module.title}
              className={`rounded-2xl border p-6 ${
                module.dark
                  ? 'border-navy bg-navy text-white md:col-span-2 lg:col-span-1'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <module.icon className={`mb-4 h-8 w-8 ${module.dark ? 'text-brand-light' : 'text-brand'}`} />
              <h3 className="text-xl font-bold">{module.title}</h3>
              <p className={`mt-2 text-sm ${module.dark ? 'text-white/70' : 'text-slate-600'}`}>{module.body}</p>
              {module.metric && (
                <p className="mt-6 text-2xl font-bold tracking-tight text-brand-light">{module.metric}</p>
              )}
              {module.tags && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {module.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        module.dark ? 'bg-white/10 text-white' : 'bg-brand-soft text-brand'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="bg-[#F8F9FB] py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <Image
              src="/screens/dashboard.jpg"
              alt="Operations dashboard preview"
              width={1200}
              height={800}
              className="h-auto w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Engineered for Excellence</h2>
            <ul className="mt-8 space-y-6">
              <li className="flex gap-4">
                <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-brand" />
                <div>
                  <h3 className="font-bold">Kenyan Localization</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    KSh currency throughout, invoice workflows ready for local tax practice, and M-Pesa STK Push for client payments.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <ChefHat className="mt-1 h-6 w-6 shrink-0 text-brand" />
                <div>
                  <h3 className="font-bold">Staff Governance</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Assign crews per event, snapshot salaries, and keep service quality visible from inquiry to completion.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <Sparkles className="mt-1 h-6 w-6 shrink-0 text-brand" />
                <div>
                  <h3 className="font-bold">Premium Interface</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Zero-clutter design for operators — and a polished client portal for bookings, quotations, and invoices.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="stories" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">Inside the Dashboard</h2>
          <p className="mt-3 text-slate-600">
            Discover unforgettable dining experiences — browse packages, track bookings, and settle invoices without leaving the portal.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { src: '/screens/catalog.jpg', label: 'Menu & packages' },
            { src: '/screens/calendar.jpg', label: 'Event calendar' },
            { src: '/screens/invoices.jpg', label: 'Invoicing & M-Pesa' },
          ].map((shot) => (
            <figure key={shot.src} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <Image src={shot.src} alt={shot.label} width={800} height={600} className="h-48 w-full object-cover object-top" />
              <figcaption className="px-4 py-3 text-sm font-semibold text-slate-700">{shot.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-navy py-24 text-white">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12vw] font-black uppercase tracking-tighter text-white/5">
          Dine Events
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold sm:text-5xl">Experience the Crimson Standard.</h2>
          <p className="mt-4 text-white/70">
            Join caterers who run operations and client experiences on one connected platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-dark">
              Request a Demo
            </Link>
            <Link href="/login" className="rounded-lg border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
              Contact Sales
            </Link>
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.25em] text-white/40">
            Designed in Nairobi — Deployed Globally
          </p>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Image src="/logo_dine.png" alt="" width={28} height={28} className="rounded-full" />
            <span className="font-semibold text-slate-700">Dine Events</span>
          </div>
          <div className="flex gap-6">
            <Link href="/portal/help" className="hover:text-brand">Support</Link>
            <span>Legal</span>
            <span>Privacy</span>
          </div>
          <p>© {new Date().getFullYear()} Dine Events. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
