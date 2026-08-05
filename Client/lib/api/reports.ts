import { apiClient } from './client'
import type { EventResponse } from './events'
import type { PaymentResponse } from './portal'
import type { StaffPricingMethod } from './staff'
import type { PricingType } from './inventory'

export type MonthlyFinancialEntry = {
  month: string
  collected: number
  refunded: number
  net: number
  paymentCount: number
}

export type OutstandingInvoiceEntry = {
  invoiceId: number
  invoiceNumber: string
  eventId: number | null
  eventName: string | null
  clientName: string | null
  amountDue: number
  amountPaid: number
  balance: number
  dueDate: string | null
  invoiceStatus: string
  createdAt: string | null
  overdue: boolean
}

export type FinancialReport = {
  totalRevenue: number
  totalRefunded: number
  totalOutstanding: number
  totalInvoiced: number
  invoiceCount: number
  paidInvoiceCount: number
  outstandingInvoiceCount: number
  refundCount: number
  monthly: MonthlyFinancialEntry[]
  payments: PaymentResponse[]
  outstandingInvoices: OutstandingInvoiceEntry[]
  refunds: PaymentResponse[]
}

export type MonthlyCountEntry = {
  month: string
  count: number
  guests: number
}

export type EventsReport = {
  totalEvents: number
  statusCounts: Record<string, number>
  upcomingCount: number
  totalGuests: number
  monthly: MonthlyCountEntry[]
  events: EventResponse[]
}

export type TopClientEntry = {
  clientId: number
  clientName: string
  companyName: string | null
  clientEmail: string | null
  eventCount: number
  totalPaid: number
}

export type ClientsReport = {
  totalClients: number
  openFeedbackCount: number
  inProgressFeedbackCount: number
  resolvedFeedbackCount: number
  topClients: TopClientEntry[]
}

export type StaffUtilizationEntry = {
  staffId: number
  staffName: string
  staffRole: string | null
  staffEmail: string | null
  staffPhone: string | null
  staffSalary: number
  pricingMethod: StaffPricingMethod | null
  assignmentCount: number
  totalEarned: number
}

export type StaffAssignmentReportEntry = {
  staffAssignmentId: number
  staffId: number | null
  staffName: string | null
  staffRole: string | null
  roleForEvent: string | null
  eventId: number | null
  eventName: string | null
  eventStatus: string | null
  eventDateTime: string | null
  salaryAtAssignment: number | null
  assignmentStatus: string | null
}

export type StaffReport = {
  totalStaff: number
  totalAssignments: number
  unassignedStaffCount: number
  totalAssignmentCost: number
  roleCounts: Record<string, number>
  staff: StaffUtilizationEntry[]
  assignments: StaffAssignmentReportEntry[]
}

export type InventoryStockEntry = {
  inventoryId: number
  inventoryName: string
  stockQuantity: number
  allocatedQuantity: number
  availableQuantity: number
  unitPrice: number
  stockValue: number
  utilizationPercent: number
}

export type InventoryAllocationReportEntry = {
  allocationId: number
  inventoryId: number | null
  inventoryName: string | null
  eventId: number | null
  eventName: string | null
  eventStatus: string | null
  clientName: string | null
  pricingType: PricingType | null
  quantityAllocated: number | null
  quantityReturned: number | null
  totalCost: number | null
}

export type InventoryReport = {
  totalItems: number
  totalStockUnits: number
  totalAllocatedUnits: number
  lowStockCount: number
  outOfStockCount: number
  totalAllocationValue: number
  items: InventoryStockEntry[]
  allocations: InventoryAllocationReportEntry[]
}

export const getFinancialReport = () => apiClient<FinancialReport>('/reports/financial')
export const getEventsReport = () => apiClient<EventsReport>('/reports/events')
export const getClientsReport = () => apiClient<ClientsReport>('/reports/clients')
export const getStaffReport = () => apiClient<StaffReport>('/reports/staff')
export const getInventoryReport = () => apiClient<InventoryReport>('/reports/inventory')
