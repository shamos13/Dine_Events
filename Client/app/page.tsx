import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  ChefHat,
  CheckCircle2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquareHeart,
  Smartphone,
  Users,
  UtensilsCrossed,
} from 'lucide-react'

const workflow = [
  {
    step: '01',
    title: 'Capture the inquiry',
    body: 'A client reaches out or builds a request in the portal. The event lands on your dashboard as an inquiry with date, venue, and guest count.',
    icon: ClipboardList,
  },
  {
    step: '02',
    title: 'Build the menu & quote',
    body: 'Pick dishes and packages from your catalog, price per guest, and send a quotation the client can review and approve online.',
    icon: UtensilsCrossed,
  },
  {
    step: '03',
    title: 'Confirm & schedule',
    body: 'Once approved, confirm the event. Assign staff, allocate rentals and equipment, and watch the calendar flag any conflicts.',
    icon: CalendarDays,
  },
  {
    step: '04',
    title: 'Deliver the event',
    body: 'Your crew works from one source of truth — menu selections, staffing, and rental checklists — from setup to last plate.',
    icon: ChefHat,
  },
  {
    step: '05',
    title: 'Invoice & get paid',
    body: 'Generate the invoice, trigger an M-Pesa STK push, and reconcile payments automatically. Then collect client feedback.',
    icon: Smartphone,
  },
]

const modules = [
  {
    title: 'Event Management',
    body: 'Every event moves through a clear lifecycle — inquiry, tentative, confirmed, completed — with logistics, staffing, and billing attached.',
    icon: LayoutDashboard,
  },
  {
    title: 'Menu Catalog & Packages',
    body: 'A curated library of Kenyan dishes and buffet or plated packages with per-guest pricing, ready to drop into any quote.',
    icon: UtensilsCrossed,
  },
  {
    title: 'Quotations & Invoicing',
    body: 'Professional quotations clients approve online, converting into invoices with balances tracked in KSh end to end.',
    icon: FileText,
  },
  {
    title: 'M-Pesa Payments',
    body: 'STK push straight to the client’s phone, automatic reconciliation, and manual receipt confirmation when needed.',
    icon: Smartphone,
  },
  {
    title: 'Staff & Rentals',
    body: 'Assign crews per event with salary snapshots, and track chafers, linen, and décor so nothing is double-booked.',
    icon: Users,
  },
  {
    title: 'Reports & Feedback',
    body: 'Revenue and event performance reports, admin notifications, and client feedback that closes the loop on every function.',
    icon: MessageSquareHeart,
  },
]

const portalPoints = [
  'Browse your menu catalog and packages',
  'Build and submit event requests online',
  'Review and approve quotations in one click',
  'Pay invoices instantly via M-Pesa',
  'Track bookings and share feedback after the event',
]

const gallery = [
  {
    src: '/events/kenyan-wedding-catering.png',
    title: 'Weddings',
    caption: 'Garden receptions, buffet lines, and plated service at scale.',
  },
  {
    src: '/events/kenyan-corporate-catering.png',
    title: 'Corporate',
    caption: 'Launches, conferences, and boardroom catering done crisp.',
  },
  {
    src: '/events/kenyan-feast-nyamachoma.png',
    title: 'Celebrations',
    caption: 'Nyama choma, family feasts, and everything in between.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo_dine.png" alt="Dine Events" width={36} height={36} className="rounded-full" />
            <span className="text-sm font-bold tracking-wide">DINE EVENTS</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <a href="#workflow" className="hover:text-brand">How It Works</a>
            <a href="#platform" className="hover:text-brand">Platform</a>
            <a href="#portal" className="hover:text-brand">Client Portal</a>
            <a href="#events" className="hover:text-brand">Events</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-slate-700 hover:text-brand sm:block">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-navy text-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:py-24 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80">
              <ChefHat className="h-3.5 w-3.5 text-brand-light" /> Built for Kenyan Caterers
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Run every event, <span className="font-serif italic text-brand-light">from inquiry to payday.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
              Dine Events is the all-in-one platform for professional caterers — events, menus, staff, rentals,
              quotations, invoices, and M-Pesa payments in one place, with a polished portal for your clients.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                Start Free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#workflow"
                className="rounded-lg border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                See How It Works
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/60">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-light" /> M-Pesa built in</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-light" /> KSh throughout</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-light" /> Client self-service portal</span>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <Image
                src="/events/kenyan-wedding-catering.png"
                alt="Outdoor Kenyan wedding catering setup"
                width={900}
                height={675}
                priority
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-xl sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                <Smartphone className="h-4 w-4 text-green-600" />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-500">M-Pesa payment received</p>
                <p className="text-sm font-bold text-slate-900">KSh 250,000 · Wedding, Karen</p>
              </div>
            </div>
            <div className="absolute -top-4 right-6 hidden rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-lg lg:block">
              Event confirmed ✓ 180 guests
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">One workflow, zero dropped plates</h2>
            <p className="mt-3 text-slate-600">
              Every event follows the same clear path through the platform — so your team always knows what happens next.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">Inquiry</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">Tentative</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">Confirmed</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">Completed</span>
          </div>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {workflow.map((item) => (
            <article key={item.step} className="relative rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-brand/40 hover:shadow-md">
              <span className="text-xs font-black tracking-widest text-brand/40">{item.step}</span>
              <item.icon className="mt-3 h-7 w-7 text-brand" />
              <h3 className="mt-3 font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="platform" className="bg-[#F8F9FB] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">Everything your catering house runs on</h2>
            <p className="mt-3 text-slate-600">
              Six connected modules keep kitchens, crews, and cashflow in sync — designed in Nairobi for how Kenyan caterers actually work.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <article key={module.title} className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-brand/40 hover:shadow-md">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
                  <module.icon className="h-5 w-5 text-brand" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{module.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{module.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="portal" className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand">Client Portal</p>
          <h2 className="text-3xl font-bold sm:text-4xl">Your clients get the five-star treatment too</h2>
          <p className="mt-3 text-slate-600">
            No more back-and-forth over WhatsApp and email. Clients log into their own portal to plan, approve, and pay — while you stay in control.
          </p>
          <ul className="mt-6 space-y-3">
            {portalPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                {point}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-soft"
          >
            Give Your Clients a Portal <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
          <Image
            src="/events/kenyan-corporate-catering.png"
            alt="Kenyan catering team serving a corporate event"
            width={900}
            height={675}
            className="h-auto w-full object-cover"
          />
        </div>
      </section>

      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold sm:text-4xl">Inside the platform</h2>
              <p className="mt-3 text-white/70">
                A zero-clutter dashboard for operators — calendar, catalog, and invoicing exactly where you expect them.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { src: '/screens/dashboard.jpg', label: 'Operations dashboard' },
              { src: '/screens/calendar.jpg', label: 'Event calendar & conflicts' },
              { src: '/screens/invoices.jpg', label: 'Invoicing & M-Pesa payments' },
            ].map((shot) => (
              <figure key={shot.src} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <Image src={shot.src} alt={shot.label} width={800} height={600} className="h-44 w-full object-cover object-top" />
                <figcaption className="px-4 py-3 text-sm font-semibold text-white/80">{shot.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">Made for Kenyan events</h2>
          <p className="mt-3 text-slate-600">
            From garden weddings in Karen to product launches in Westlands and nyama choma weekends upcountry — one platform for every function you cater.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {gallery.map((item) => (
            <figure key={item.src} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.title}
                  width={800}
                  height={600}
                  className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <figcaption className="px-4 py-4">
                <p className="font-bold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-navy py-24 text-white">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12vw] font-black uppercase tracking-tighter text-white/5">
          Dine Events
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold sm:text-5xl">Ready to cater smarter?</h2>
          <p className="mt-4 text-white/70">
            Join caterers who run operations and client experiences on one connected platform — from the first inquiry to the final M-Pesa receipt.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-dark">
              Create Your Account
            </Link>
            <Link href="/login" className="rounded-lg border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
              Sign In
            </Link>
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.25em] text-white/40">
            Designed in Nairobi — Built for Kenyan Caterers
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
