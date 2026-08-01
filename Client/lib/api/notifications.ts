import { apiClient } from './client'

export type AdminNotification = {
  id: string
  type: 'EVENT_INQUIRY' | 'FEEDBACK' | string
  title: string
  message: string
  href: string
  createdAt: string | null
}

export const getAdminNotifications = () => apiClient<AdminNotification[]>('/admin/notifications')

const SEEN_KEY = 'dine_admin_notification_seen'

export function getSeenNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export function markNotificationsSeen(ids: string[]) {
  if (typeof window === 'undefined') return
  const seen = getSeenNotificationIds()
  ids.forEach((id) => seen.add(id))
  localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen)))
}
