'use client'

import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import NewPackageModal from '@/components/catalog/NewPackageModal'
import { ApiError } from '@/lib/api/client'
import { formatKsh, getMenuPackages, type MenuPackageResponse } from '@/lib/api/menu'

function packageSummary(pkg: MenuPackageResponse): string {
  if (pkg.menuItemNames?.length) {
    return pkg.menuItemNames.join(', ')
  }
  if (pkg.serviceType) {
    return `${pkg.serviceType.charAt(0).toUpperCase()}${pkg.serviceType.slice(1).replace('-', ' ')} service`
  }
  return 'No menu items linked yet'
}

export default function Packages() {
  const [packages, setPackages] = useState<MenuPackageResponse[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadPackages = useCallback(() => {
    setLoading(true)
    setError(null)
    getMenuPackages()
      .then(setPackages)
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load packages.')
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadPackages()
  }, [loadPackages])

  const visiblePackages = useMemo(
    () =>
      packages.filter((pkg) =>
        `${pkg.packageName} ${pkg.serviceType ?? ''} ${pkg.menuItemNames?.join(' ') ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [packages, search]
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Packages</h1>
            <p className="text-gray-600">Manage your package offerings and pricing</p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A01F1A]"
          >
            <Plus className="h-5 w-5" />
            New Package
          </button>
        </div>

        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search packages"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder:text-gray-500 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading packages...</p>
        ) : error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </p>
        ) : visiblePackages.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
            {packages.length === 0
              ? 'No packages yet. Create your first package to get started.'
              : 'No packages match your search.'}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-blue-50">
                <tr>
                  {['Package Name', 'Included Items', 'Default Price (Per Guest)', 'Actions'].map((column) => (
                    <th key={column} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiblePackages.map((pkg, index) => (
                  <tr
                    key={pkg.menuPackageId}
                    className={index !== visiblePackages.length - 1 ? 'border-b border-gray-200' : ''}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/catalog/packages/${pkg.menuPackageId}`}
                        className="font-semibold text-gray-900 hover:text-[#CC2622] hover:underline"
                      >
                        {pkg.packageName}
                      </Link>
                      {pkg.serviceType && (
                        <p className="mt-1 text-xs capitalize text-gray-500">{pkg.serviceType.replace('-', ' ')}</p>
                      )}
                    </td>
                    <td className="max-w-md px-6 py-4 text-sm text-gray-600">{packageSummary(pkg)}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatKsh(pkg.pricePerPax)}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/catalog/packages/${pkg.menuPackageId}`}
                        className="text-sm font-medium text-[#CC2622] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />

      <NewPackageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadPackages}
      />
    </div>
  )
}
