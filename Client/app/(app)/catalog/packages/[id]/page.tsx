'use client'

import { Archive, ChevronRight, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { ApiError } from '@/lib/api/client'
import { formatKsh, getMenuPackages, type MenuPackageResponse } from '@/lib/api/menu'

function formatServiceType(serviceType: string | null): string | null {
  if (!serviceType) return null
  return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('-', ' ')
}

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [pkg, setPkg] = useState<MenuPackageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMenuPackages()
      .then((packages) => {
        const found = packages.find((item) => item.menuPackageId === Number(id))
        if (!found) {
          throw new ApiError({ status: 404, error: 'Not Found', message: 'Package not found.' })
        }
        setPkg(found)
      })
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load package.')
      )
      .finally(() => setLoading(false))
  }, [id])

  const includedItems = useMemo(() => pkg?.menuItemNames ?? [], [pkg])
  const serviceLabel = formatServiceType(pkg?.serviceType ?? null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="p-6 text-gray-600">Loading package...</main>
        <Footer />
      </div>
    )
  }

  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="p-6">
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error ?? 'Package not found.'}
          </p>
          <Link href="/catalog/packages" className="mt-4 inline-block text-sm font-medium text-[#CC2622] hover:underline">
            Back to packages
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6">
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/catalog/packages" className="hover:text-[#CC2622] hover:underline">
            Packages
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-gray-900">{pkg.packageName}</span>
        </nav>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{pkg.packageName}</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled
              title="Package updates are not available in the current API"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-400"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              disabled
              title="Package archival is not available in the current API"
              className="inline-flex items-center gap-2 rounded-lg border border-red-100 px-4 py-2 text-sm font-semibold text-red-300"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Price</p>
              <p className="mt-2 text-3xl font-bold text-[#CC2622]">{formatKsh(pkg.pricePerPax)}</p>
              <p className="mt-1 text-sm text-gray-500">Per guest</p>
            </div>
            {pkg.minGuests != null && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Minimum Guests</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{pkg.minGuests}</p>
              </div>
            )}
            {serviceLabel && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Service Type</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{serviceLabel}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Menu Items</h2>
            <p className="mt-1 text-sm text-gray-600">Menu items included in this package</p>
          </div>

          {includedItems.length === 0 ? (
            <p className="text-sm text-gray-600">No menu items are linked to this package.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Menu Item</th>
                  </tr>
                </thead>
                <tbody>
                  {includedItems.map((itemName, index) => (
                    <tr
                      key={`${itemName}-${index}`}
                      className={index !== includedItems.length - 1 ? 'border-b border-gray-200' : ''}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{itemName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-gray-500">
            Package composition is set when the package is created. The backend returns item names only.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
