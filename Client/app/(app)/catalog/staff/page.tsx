'use client'

import Image from 'next/image'
import { Edit, Plus, Search, UserRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import StaffModal from '@/components/catalog/StaffModal'
import { ApiError } from '@/lib/api/client'
import {
  formatStaffPrice,
  formatStaffPricingMethod,
  getStaff,
  type StaffResponse,
} from '@/lib/api/staff'

export default function CatalogStaffPage() {
  const [staff, setStaff] = useState<StaffResponse[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffResponse | null>(null)

  const loadStaff = useCallback(() => {
    setLoading(true)
    setError(null)
    getStaff()
      .then(setStaff)
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load staff.')
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadStaff()
  }, [loadStaff])

  const visibleStaff = useMemo(
    () =>
      staff.filter((member) =>
        `${member.staffName} ${member.staffRole} ${member.responsibilities?.join(' ') ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [staff, search]
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Staff</h1>
            <p className="text-gray-600">Manage staff roles, photos, and pricing structures</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingStaff(null)
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#A01F1A]"
          >
            <Plus className="h-5 w-5" />
            Add Staff Member
          </button>
        </div>

        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search staff by name, role, or responsibility"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder:text-gray-500 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading staff...</p>
        ) : error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </p>
        ) : visibleStaff.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
            {staff.length === 0
              ? 'No staff members yet. Add your first staff role to get started.'
              : 'No staff members match your search.'}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full min-w-[860px]">
              <thead className="border-b border-gray-200 bg-blue-50">
                <tr>
                  {['Staff Name', 'Responsibilities', 'Pricing Method', 'Default Price', 'Actions'].map(
                    (column) => (
                      <th
                        key={column}
                        className={`px-6 py-4 text-sm font-semibold text-gray-700 ${
                          column === 'Default Price' || column === 'Actions' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {column}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleStaff.map((member, index) => (
                  <tr
                    key={member.staffId}
                    className={index !== visibleStaff.length - 1 ? 'border-b border-gray-200' : ''}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-gray-200 bg-[#edf4ff]">
                          {member.profileImageUrl ? (
                            <Image
                              src={member.profileImageUrl}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#CC2622]">
                              <UserRound className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {member.staffName}{' '}
                            <span className="font-medium text-gray-600">({member.staffRole})</span>
                          </p>
                          {member.staffPhone && (
                            <p className="mt-0.5 text-xs text-gray-500">{member.staffPhone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-sm px-6 py-5 text-sm leading-6 text-gray-600">
                      {member.responsibilities?.length
                        ? member.responsibilities.join(', ')
                        : 'No responsibilities recorded'}
                    </td>
                    <td className="px-6 py-5 text-gray-700">
                      {formatStaffPricingMethod(member.pricingMethod)}
                    </td>
                    <td className="px-6 py-5 text-right font-semibold text-gray-900">
                      {formatStaffPrice(member.staffSalary, member.pricingMethod)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          aria-label={`Edit ${member.staffName}`}
                          onClick={() => {
                            setEditingStaff(member)
                            setModalOpen(true)
                          }}
                          className="rounded-lg p-2 transition hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />

      <StaffModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadStaff}
        staff={editingStaff}
      />
    </div>
  )
}
