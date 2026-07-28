'use client'

import { Search, UserPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { ApiError } from '@/lib/api/client'
import { getClients, type ClientResponse } from '@/lib/api/clients'

export default function Crm() {
  const [clients, setClients] = useState<ClientResponse[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { getClients().then(setClients).catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load clients.')).finally(() => setLoading(false)) }, [])
  const visibleClients = useMemo(() => clients.filter((client) => `${client.fullName} ${client.companyName ?? ''} ${client.clientEmail ?? ''}`.toLowerCase().includes(search.toLowerCase())), [clients, search])

  return <div className="min-h-screen flex flex-col bg-gray-50"><Header /><main className="flex-1 p-6"><div className="mb-8 flex items-start justify-between"><div><h1 className="mb-2 text-3xl font-bold text-gray-900">Clients</h1><p className="text-gray-600">Manage your client relationships and contact information</p></div><button className="flex items-center gap-2 rounded-lg bg-[#CC2622] px-6 py-3 font-medium text-white hover:bg-[#A01F1A]"><UserPlus className="h-4 w-4" />Add Client</button></div><div className="mb-6 max-w-md"><div className="relative"><Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clients..." className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#CC2622]" /></div></div>{loading ? <p className="text-gray-600">Loading clients...</p> : error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p> : <div className="overflow-hidden rounded-lg border border-gray-200 bg-white"><table className="w-full"><thead className="border-b border-gray-200 bg-blue-50"><tr>{['Client', 'Email', 'Phone', 'Events'].map((item) => <th key={item} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{item}</th>)}</tr></thead><tbody>{visibleClients.map((client, index) => <tr key={client.clientId} className={index !== visibleClients.length - 1 ? 'border-b border-gray-200' : ''}><td className="px-6 py-4 font-semibold text-gray-900">{client.companyName || client.fullName}</td><td className="px-6 py-4 text-gray-600">{client.clientEmail ?? '—'}</td><td className="px-6 py-4 text-gray-600">{client.clientPhone}</td><td className="px-6 py-4 font-semibold text-gray-900">{client.events?.length ?? 0}</td></tr>)}</tbody></table></div>}</main><Footer /></div>
}
