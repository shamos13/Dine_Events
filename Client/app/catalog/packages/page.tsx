'use client'

import Footer from '@/components/Footer'
import Header from '@/components/Header'

export default function Packages() {
  return <div className="min-h-screen flex flex-col bg-gray-50"><Header /><main className="flex-1 p-6"><h1 className="mb-2 text-3xl font-bold text-gray-900">Packages</h1><p className="text-gray-600">Menu packages are not available from the current backend yet.</p><div className="mt-6 border-y border-gray-200 bg-white px-6 py-12 text-center text-gray-600">No package API has been implemented. This page intentionally does not display mock package data.</div></main><Footer /></div>
}
