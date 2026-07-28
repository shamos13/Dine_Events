import { apiClient } from './client'

export type StaffResponse = { staffId: number; staffName: string; staffRole: string; staffEmail: string | null; staffPhone: string; staffSalary: number; responsibilities: string[] }
export type StaffRequest = { staffName: string; staffEmail?: string; staffPhone: string; staffRole: string; staffSalary: number; responsibilities?: string[] }
export type StaffAssignmentResponse = {
  staffAssignmentId: number
  staffId: number
  eventId: number
  staffName: string
  staffRole: string
  roleForEvent: string | null
  eventName: string
  salaryAtAssignment: number | null
  assignmentStatus: string | null
  responsibilities: string[]
}
export type StaffAssignmentRequest = { staffId: number; eventId: number; salaryAtAssignment?: number }

export const getStaff = () => apiClient<StaffResponse[]>('/staff/all-staff')
export const createStaff = (payload: StaffRequest) => apiClient<StaffResponse>('/staff/new-staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
export const getStaffAssignments = () => apiClient<StaffAssignmentResponse[]>('/staff-assignment/all-assignments')
export const getStaffAssignmentsByEvent = (eventId: number) => apiClient<StaffAssignmentResponse[]>(`/staff-assignment/event/${eventId}`)
export const createStaffAssignment = (payload: StaffAssignmentRequest) => apiClient<StaffAssignmentResponse>('/staff-assignment/assign-staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
