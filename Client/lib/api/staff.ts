import { apiClient } from './client'

export type StaffPricingMethod = 'HOURLY' | 'FLAT_RATE'

export type StaffResponse = {
  staffId: number
  staffName: string
  staffRole: string
  staffEmail: string | null
  staffPhone: string
  staffSalary: number
  pricingMethod: StaffPricingMethod | null
  profileImageUrl: string | null
  responsibilities: string[]
}

export type StaffRequest = {
  staffName: string
  staffEmail?: string
  staffPhone: string
  staffRole: string
  staffSalary: number
  pricingMethod?: StaffPricingMethod
  profileImageUrl?: string
  responsibilities?: string[]
}

export type StaffAssignmentResponse = {
  staffAssignmentId: number
  staffId: number
  eventId: number
  staffName: string
  staffRole: string
  roleForEvent: string | null
  eventName: string
  salaryAtAssignment: number | null
  pricingMethod: StaffPricingMethod | null
  profileImageUrl: string | null
  assignmentStatus: string | null
  responsibilities: string[]
}

export type StaffAssignmentRequest = {
  staffId: number
  eventId: number
  salaryAtAssignment?: number
}

export const getStaff = () => apiClient<StaffResponse[]>('/staff/all-staff')

export const createStaff = (payload: StaffRequest) =>
  apiClient<StaffResponse>('/staff/new-staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export const updateStaff = (staffId: number, payload: StaffRequest) =>
  apiClient<StaffResponse>(`/staff/${staffId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export const getStaffAssignments = () =>
  apiClient<StaffAssignmentResponse[]>('/staff-assignment/all-assignments')

export const getStaffAssignmentsByEvent = (eventId: number) =>
  apiClient<StaffAssignmentResponse[]>(`/staff-assignment/event/${eventId}`)

export const createStaffAssignment = (payload: StaffAssignmentRequest) =>
  apiClient<StaffAssignmentResponse>('/staff-assignment/assign-staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export const removeStaffAssignment = (staffAssignmentId: number) =>
  apiClient<void>(`/staff-assignment/${staffAssignmentId}`, {
    method: 'DELETE',
  })

export function formatStaffPricingMethod(method: StaffPricingMethod | null | undefined): string {
  if (method === 'HOURLY') return 'Hourly'
  return 'Flat rate'
}

export function formatStaffPrice(
  amount: number | null | undefined,
  method: StaffPricingMethod | null | undefined
): string {
  if (amount === null || amount === undefined) return 'Not recorded'
  const formatted = `KSh ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
  return method === 'HOURLY' ? `${formatted}/hr` : formatted
}
