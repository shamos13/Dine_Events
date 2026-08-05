'use client'

import { useEffect, useState } from 'react'
import { Check, KeyRound, Loader2 } from 'lucide-react'
import ImageUpload from '@/components/ui/ImageUpload'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { ApiError, setSessionTokens } from '@/lib/api/client'
import {
  changePortalPassword,
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
  const [changingPassword, setChangingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    clientEmail: '',
    clientPhone: '',
    companyName: '',
    profileImageUrl: null as string | null,
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    getPortalProfile()
      .then((data) => {
        setProfile(data)
        setForm({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          clientEmail: data.clientEmail ?? '',
          clientPhone: data.clientPhone ?? '',
          companyName: data.companyName ?? '',
          profileImageUrl: data.profileImageUrl,
        })
        updateUser({
          email: data.clientEmail,
          fullName: data.fullName,
          businessName: data.companyName,
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
        clientEmail: form.clientEmail.trim(),
        clientPhone: form.clientPhone.trim(),
        companyName: form.companyName.trim() || undefined,
        profileImageUrl: form.profileImageUrl,
      })
      setProfile(saved)
      if (saved.token && saved.refreshToken) {
        setSessionTokens(saved.token, saved.refreshToken)
      }
      updateUser({
        email: saved.clientEmail,
        fullName: saved.fullName,
        businessName: saved.companyName,
        profileImageUrl: saved.profileImageUrl,
      })
      toast('Profile updated.', 'success')
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault()
    setPasswordError(null)
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }
    setChangingPassword(true)
    try {
      await changePortalPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast('Password updated.', 'success')
    } catch (reason: unknown) {
      setPasswordError(reason instanceof ApiError ? reason.message : 'Unable to change password.')
    } finally {
      setChangingPassword(false)
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
        <p className="mt-1 text-gray-600">Update your contact details, photo, and password for the client portal.</p>
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
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={form.clientEmail}
              onChange={(event) => setForm((current) => ({ ...current, clientEmail: event.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]"
            />
            <span className="mt-1 block text-xs font-normal text-gray-500">
              This is also your login email. Changing it signs you in with the new address.
            </span>
          </label>

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

          {profile?.clientEmail && form.clientEmail.trim().toLowerCase() !== profile.clientEmail.toLowerCase() && (
            <p className="text-sm text-amber-800">
              Saving will update your login email from{' '}
              <span className="font-medium">{profile.clientEmail}</span> to{' '}
              <span className="font-medium">{form.clientEmail.trim()}</span>.
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

      <Card>
        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Change password</h2>
            <p className="mt-1 text-sm text-gray-600">Use a password with at least 8 characters.</p>
          </div>

          {passwordError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {passwordError}
            </p>
          )}

          <label className="block text-sm font-semibold text-gray-700">
            Current password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
              }
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-gray-700">
              New password
              <input
                required
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]"
              />
            </label>
            <label className="block text-sm font-semibold text-gray-700">
              Confirm new password
              <input
                required
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center gap-2 rounded-lg border border-[#CC2622] px-5 py-2.5 text-sm font-semibold text-[#CC2622] transition hover:bg-red-50 disabled:opacity-50"
            >
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Update password
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
