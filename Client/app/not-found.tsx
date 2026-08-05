export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FB] px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-brand">404</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 max-w-md text-gray-600">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <a href="/" className="mt-6 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">
        Back to home
      </a>
    </div>
  )
}
