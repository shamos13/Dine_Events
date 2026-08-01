'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import ImageUpload from '@/components/ui/ImageUpload'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api/client'
import {
  getPortalProfile,
  updatePortalProfile,
  type PortalProfile,
} from '@/lib/api/portal'
import { useAuth } from '@/lib/auth-context'

export default function PortalProfilePage() {
  const { updateUser } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<PortalProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    clientPhone: '',
    companyName: '',
    profileImageUrl: null as string | null,
  })

  useEffect(() => {
    getPortalProfile()
      .then((data) => {
        setProfile(data)
        setForm({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          clientPhone: data.clientPhone ?? '',
          companyName: data.companyName ?? '',
          profileImageUrl: data.profileImageUrl,
        })
        updateUser({
          fullName: data.fullName,
          profileImageUrl: data.profileImageUrl,
        })
      })
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load profile.')
      )
      .finally(() => setLoading(false))
  }, [updateUser])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const saved = await updatePortalProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        clientPhone: form.clientPhone.trim(),
        companyName: form.companyName.trim() || undefined,
        profileImageUrl: form.profileImageUrl,
      })
      setProfile(saved)
      updateUser({
        fullName: saved.fullName,
        profileImageUrl: saved.profileImageUrl,
      })
      toast('Profile updated.', 'success')
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading profile...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-gray-600">Update your details and profile photo for the client portal.</p>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-5">
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <ImageUpload
            value={form.profileImageUrl}
            onChange={(url) => setForm((current) => ({ ...current, profileImageUrl: url }))}
            folder="clients"
            label="Profile photo"
            shape="circle"
            helperText="Upload a photo — you’ll see a preview before it finishes uploading."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-gray-700">
              First name
              <input
                required
                value={form.firstName}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]"
              />
            </label>
            <label className="block text-sm font-semibold text-gray-700">
              Last name
              <input
                value={form.lastName}
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-gray-700">
            Phone
            <input
              required
              value={form.clientPhone}
              onChange={(event) => setForm((current) => ({ ...current, clientPhone: event.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]"
            />
          </label>

          <label className="block text-sm font-semibold text-gray-700">
            Company / organization
            <input
              value={form.companyName}
              onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]"
            />
          </label>

          {profile?.clientEmail && (
            <p className="text-sm text-gray-500">
              Signed in as <span className="font-medium text-gray-700">{profile.clientEmail}</span>
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A01F1A] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save profile
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
