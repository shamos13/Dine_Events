import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatKsh } from '@/lib/api/menu'
import type {
  ClientsReport,
  EventsReport,
  FinancialReport,
  InventoryReport,
  StaffReport,
} from '@/lib/api/reports'

const BRAND = { r: 204, g: 38, b: 34 }
const INK = { r: 17, g: 24, b: 39 }
const MUTED = { r: 107, g: 114, b: 128 }
const RULE = { r: 229, g: 231, b: 235 }
const SOFT = { r: 249, g: 250, b: 251 }
const HEADER_BG = { r: 254, g: 242, b: 242 }

type PdfDoc = jsPDF & {
  lastAutoTable?: { finalY: number }
}

function money(amount: number | string | null | undefined) {
  return formatKsh(amount).replace('KSh ', 'KES ')
}

function dateStamp() {
  return new Date().toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fileDate() {
  return new Date().toISOString().slice(0, 10)
}

function formatWhen(value?: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

function formatDay(value?: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString()
}

function createDocument(title: string, subtitle: string): PdfDoc {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as PdfDoc
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
  doc.rect(0, 0, pageWidth, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('DineEvents', 14, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Catering Event Management System', 14, 18)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(title, pageWidth - 14, 12, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Generated ${dateStamp()}`, pageWidth - 14, 18, { align: 'right' })

  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(title, 14, 42)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(subtitle, 14, 49)

  doc.setDrawColor(RULE.r, RULE.g, RULE.b)
  doc.setLineWidth(0.3)
  doc.line(14, 54, pageWidth - 14, 54)

  return doc
}

function drawSectionTitle(doc: PdfDoc, title: string, y: number) {
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(title, 14, y)
  return y + 4
}

function drawSummaryCards(
  doc: PdfDoc,
  cards: { label: string; value: string; hint?: string }[],
  startY: number
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const gap = 4
  const usable = pageWidth - 28
  const cardWidth = (usable - gap * (cards.length - 1)) / cards.length
  const cardHeight = 22

  cards.forEach((card, index) => {
    const x = 14 + index * (cardWidth + gap)
    doc.setFillColor(SOFT.r, SOFT.g, SOFT.b)
    doc.setDrawColor(RULE.r, RULE.g, RULE.b)
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'FD')

    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text(card.label.toUpperCase(), x + 3, startY + 6)

    doc.setTextColor(INK.r, INK.g, INK.b)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(card.value, x + 3, startY + 13, { maxWidth: cardWidth - 6 })

    if (card.hint) {
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text(card.hint, x + 3, startY + 18, { maxWidth: cardWidth - 6 })
    }
  })

  return startY + cardHeight + 8
}

function ensureSpace(doc: PdfDoc, y: number, needed: number) {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + needed > pageHeight - 18) {
    doc.addPage()
    return 18
  }
  return y
}

function finalize(doc: PdfDoc, filename: string) {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    doc.setDrawColor(RULE.r, RULE.g, RULE.b)
    doc.setLineWidth(0.2)
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text('DineEvents · Confidential operational report', 14, pageHeight - 7)
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' })
  }

  doc.save(filename)
}

function tableTheme() {
  return {
    theme: 'grid' as const,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [INK.r, INK.g, INK.b] as [number, number, number],
      lineColor: [RULE.r, RULE.g, RULE.b] as [number, number, number],
      lineWidth: 0.2,
      overflow: 'linebreak' as const,
    },
    headStyles: {
      fillColor: [HEADER_BG.r, HEADER_BG.g, HEADER_BG.b] as [number, number, number],
      textColor: [INK.r, INK.g, INK.b] as [number, number, number],
      fontStyle: 'bold' as const,
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [SOFT.r, SOFT.g, SOFT.b] as [number, number, number],
    },
    margin: { left: 14, right: 14 },
  }
}

export function downloadFinancialReportPdf(report: FinancialReport) {
  const outstanding = report.outstandingInvoices ?? []
  const refunds = report.refunds ?? []

  const doc = createDocument(
    'Financial Report',
    'Net revenue, outstanding balances, refunds, and payment activity from live records.'
  )

  let y = drawSummaryCards(
    doc,
    [
      { label: 'Net revenue', value: money(report.totalRevenue), hint: 'Collected − refunds' },
      { label: 'Outstanding', value: money(report.totalOutstanding), hint: `${report.outstandingInvoiceCount ?? outstanding.length} invoices` },
      { label: 'Refunded', value: money(report.totalRefunded), hint: `${report.refundCount ?? refunds.length} refunds` },
      {
        label: 'Invoices',
        value: `${report.paidInvoiceCount} / ${report.invoiceCount}`,
        hint: 'Paid vs total',
      },
    ],
    60
  )

  y = drawSectionTitle(doc, 'Monthly revenue (last 6 months)', y)
  autoTable(doc, {
    ...tableTheme(),
    startY: y,
    head: [['Month', 'Collected', 'Refunded', 'Net', 'Payments']],
    body: report.monthly.map((entry) => [
      entry.month,
      money(entry.collected),
      money(entry.refunded),
      money(entry.net),
      String(entry.paymentCount),
    ]),
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  })

  y = (doc.lastAutoTable?.finalY ?? y) + 10
  y = ensureSpace(doc, y, 24)
  y = drawSectionTitle(doc, `Outstanding payments (${outstanding.length})`, y)
  autoTable(doc, {
    ...tableTheme(),
    startY: y,
    head: [['Invoice', 'Client', 'Event', 'Due', 'Status', 'Balance']],
    body:
      outstanding.length === 0
        ? [['No outstanding balances.', '', '', '', '', '']]
        : outstanding.map((invoice) => [
            invoice.invoiceNumber,
            invoice.clientName ?? '—',
            invoice.eventName ?? '—',
            formatDay(invoice.dueDate),
            invoice.overdue ? `${invoice.invoiceStatus} (OVERDUE)` : invoice.invoiceStatus,
            money(invoice.balance),
          ]),
    columnStyles: { 5: { halign: 'right' } },
  })

  y = (doc.lastAutoTable?.finalY ?? y) + 10
  y = ensureSpace(doc, y, 24)
  y = drawSectionTitle(doc, `Refunds (${refunds.length})`, y)
  autoTable(doc, {
    ...tableTheme(),
    startY: y,
    head: [['Invoice', 'Client', 'Event', 'Amount', 'Reference', 'Date']],
    body:
      refunds.length === 0
        ? [['No refunds recorded.', '', '', '', '', '']]
        : refunds.map((payment) => [
            payment.invoiceNumber,
            payment.clientName ?? '—',
            payment.eventName ?? '—',
            `−${money(payment.amount)}`,
            payment.mpesaReceiptNumber ?? payment.failureReason ?? '—',
            formatWhen(payment.completedAt ?? payment.initiatedAt),
          ]),
    columnStyles: { 3: { halign: 'right' } },
  })

  y = (doc.lastAutoTable?.finalY ?? y) + 10
  y = ensureSpace(doc, y, 24)
  y = drawSectionTitle(doc, `Payment records (${report.payments.length})`, y)

  autoTable(doc, {
    ...tableTheme(),
    startY: y,
    head: [['Invoice', 'Client', 'Amount', 'Method', 'Status', 'M-Pesa Receipt', 'Date']],
    body:
      report.payments.length === 0
        ? [['No payments recorded yet.', '', '', '', '', '', '']]
        : report.payments.map((payment) => [
            payment.invoiceNumber,
            payment.clientName ?? '—',
            `${payment.paymentStatus === 'REFUNDED' ? '−' : ''}${money(payment.amount)}`,
            payment.paymentMethod,
            payment.paymentStatus,
            payment.mpesaReceiptNumber ?? '—',
            formatWhen(payment.completedAt ?? payment.initiatedAt),
          ]),
    columnStyles: {
      2: { halign: 'right' },
      5: { font: 'courier', fontSize: 7 },
    },
  })

  y = (doc.lastAutoTable?.finalY ?? y) + 8
  y = ensureSpace(doc, y, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(
    `Total invoiced (non-cancelled): ${money(report.totalInvoiced)}. Amounts shown in Kenyan Shillings.`,
    14,
    y
  )

  finalize(doc, `financial-report-${fileDate()}.pdf`)
}

export function downloadEventsReportPdf(report: EventsReport) {
  const doc = createDocument(
    'Events Report',
    'Event volume, status mix, guest totals, and schedule detail from live records.'
  )

  let y = drawSummaryCards(
    doc,
    [
      { label: 'Total events', value: String(report.totalEvents) },
      { label: 'Upcoming', value: String(report.upcomingCount), hint: 'Excludes cancelled' },
      { label: 'Confirmed', value: String(report.statusCounts.CONFIRMED ?? 0) },
      {
        label: 'Total guests',
        value: report.totalGuests.toLocaleString(),
        hint: 'Active events',
      },
    ],
    60
  )

  y = drawSectionTitle(doc, 'Events by status', y)
  const statusRows = Object.entries(report.statusCounts)
  autoTable(doc, {
    ...tableTheme(),
    startY: y,
    head: [['Status', 'Count']],
    body: statusRows.length === 0 ? [['—', '0']] : statusRows.map(([status, count]) => [status, String(count)]),
    columnStyles: { 1: { halign: 'right' } },
  })

  y = (doc.lastAutoTable?.finalY ?? y) + 10
  y = ensureSpace(doc, y, 24)
  y = drawSectionTitle(doc, 'Events per month', y)
  autoTable(doc, {
    ...tableTheme(),
    startY: y,
    head: [['Month', 'Events', 'Guests']],
    body: report.monthly.map((entry) => [entry.month, String(entry.count), String(entry.guests)]),
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
    },
  })

  y = (doc.lastAutoTable?.finalY ?? y) + 10
  y = ensureSpace(doc, y, 24)
  y = drawSectionTitle(doc, `All events (${report.events.length})`, y)
  autoTable(doc, {
    ...tableTheme(),
    startY: y,
    head: [['Event', 'Client', 'Status', 'Guests', 'Venue', 'Date']],
    body:
      report.events.length === 0
        ? [['No events recorded yet.', '', '', '', '', '']]
        : report.events.map((event) => [
            event.eventName,
            event.clientName ?? '—',
            event.eventStatus,
            String(event.guestCount),
            event.eventVenue ?? '—',
            formatDay(event.eventDateTime),
          ]),
    columnStyles: { 3: { halign: 'right' } },
  })

  finalize(doc, `events-report-${fileDate()}.pdf`)
}

export function downloadClientsReportPdf(report: ClientsReport) {
  const doc = createDocument(
    'Clients Report',
    'Client portfolio value, event participation, and feedback status from live records.'
  )

  let y = drawSummaryCards(
    doc,
    [
      { label: 'Total clients', value: String(report.totalClients) },
      { label: 'Open feedback', value: String(report.openFeedbackCount), hint: 'Awaiting response' },
      { label: 'In progress', value: String(report.inProgressFeedbackCount) },
      { label: 'Resolved', value: String(report.resolvedFeedbackCount) },
    ],
    60
  )

  y = drawSectionTitle(doc, `Clients by value (${report.topClients.length})`, y)
  autoTable(doc, {
    ...tableTheme(),
    startY: y,
    head: [['Client', 'Company', 'Email', 'Events', 'Total paid']],
    body:
      report.topClients.length === 0
        ? [['No clients recorded yet.', '', '', '', '']]
        : report.topClients.map((client) => [
            client.clientName,
            client.companyName ?? '—',
            client.clientEmail ?? '—',
            String(client.eventCount),
            money(client.totalPaid),
          ]),
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  })

  y = (doc.lastAutoTable?.finalY ?? y) + 8
  y = ensureSpace(doc, y, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text('Clients are ranked by total amount paid across invoices.', 14, y)

  finalize(doc, `clients-report-${fileDate()}.pdf`)
}

export function downloadStaffReportPdf(report: StaffReport) {
  const doc = createDocument(
    'Staff Report',
    'Roster utilization, assignment cost, and event coverage from live records.'
  )

  let y = drawSummaryCards(
    doc,
    [
      { label: 'Total staff', value: String(report.totalStaff) },
      { label: 'Assignments', value: String(report.totalAssignments) },
      { label: 'Unassigned', value: String(report.unassignedStaffCount), hint: 'No event yet' },
      { label: 'Assignment cost', value: money(report.totalAssignmentCost), hint: 'Sum of booked rates' },
    ],
    60
  )

  y = drawSectionTitle(doc, 'Staff by role', y)
  const roleRows = Object.entries(report.roleCounts ?? {})
  autoTable(doc, {
    ...tableTheme(),
    startY: y,
    head: [['Role', 'Count']],
    body: roleRows.length === 0 ? [['—', '0']] : roleRows.map(([role, count]) => [role, String(count)]),
    columnStyles: { 1: { halign: 'right' } },
  })

  y = (doc.lastAutoTable?.finalY ?? y) + 10
  y = ensureSpace(doc, y, 24)
  y = drawSectionTitle(doc, `Staff utilization (${report.staff.length})`, y)
  autoTable(doc, {
    ...tableTheme(),
    startY: y,
    head: [['Name', 'Role', 'Rate', 'Pricing', 'Assignments', 'Earned']],
    body:
      report.staff.length === 0
        ? [['No staff recorded yet.', '', '', '', '', '']]
        : report.staff.map((member) => [
            member.staffName,
            member.staffRole ?? '—',
            money(member.staffSalary),
            member.pricingMethod ?? '—',
            String(member.assignmentCount),
            money(member.totalEarned),
          ]),
    columnStyles: {
      2: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  })

  y = (doc.lastAutoTable?.finalY ?? y) + 10
  y = ensureSpace(doc, y, 24)
  y = drawSectionTitle(doc, `Event assignments (${report.assignments.length})`, y)
  autoTable(doc, {
    ...tableTheme(),
    startY: y,
    head: [['Staff', 'Event', 'Role', 'Status', 'Date', 'Cost']],
    body:
      report.assignments.length === 0
        ? [['No assignments recorded yet.', '', '', '', '', '']]
        : report.assignments.map((assignment) => [
            assignment.staffName ?? '—',
            assignment.eventName ?? '—',
            assignment.roleForEvent ?? assignment.staffRole ?? '—',
            assignment.eventStatus ?? '—',
            formatDay(assignment.eventDateTime),
            money(assignment.salaryAtAssignment),
          ]),
    columnStyles: { 5: { halign: 'right' } },
  })

  finalize(doc, `staff-report-${fileDate()}.pdf`)
}

export function downloadInventoryReportPdf(report: InventoryReport) {
  const doc = createDocument(
    'Inventory Report',
    'Stock levels, allocation load, and rental value from live records.'
  )

  let y = drawSummaryCards(
    doc,
    [
      { label: 'Catalog items', value: String(report.totalItems) },
      { label: 'Allocated', value: `${report.totalAllocatedUnits} / ${report.totalStockUnits}`, hint: 'Units in use' },
      { label: 'Low / out', value: `${report.lowStockCount} / ${report.outOfStockCount}`, hint: 'Needs restock' },
      { label: 'Allocation value', value: money(report.totalAllocationValue), hint: 'Active rentals' },
    ],
    60
  )

  y = drawSectionTitle(doc, `Stock levels (${report.items.length})`, y)
  autoTable(doc, {
    ...tableTheme(),
    startY: y,
    head: [['Item', 'Stock', 'Allocated', 'Available', 'Util %', 'Unit price', 'Stock value']],
    body:
      report.items.length === 0
        ? [['No inventory recorded yet.', '', '', '', '', '', '']]
        : report.items.map((item) => [
            item.inventoryName,
            String(item.stockQuantity),
            String(item.allocatedQuantity),
            String(item.availableQuantity),
            `${item.utilizationPercent}%`,
            money(item.unitPrice),
            money(item.stockValue),
          ]),
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
  })

  y = (doc.lastAutoTable?.finalY ?? y) + 10
  y = ensureSpace(doc, y, 24)
  y = drawSectionTitle(doc, `Event allocations (${report.allocations.length})`, y)
  autoTable(doc, {
    ...tableTheme(),
    startY: y,
    head: [['Item', 'Event', 'Client', 'Qty', 'Returned', 'Status', 'Cost']],
    body:
      report.allocations.length === 0
        ? [['No allocations recorded yet.', '', '', '', '', '', '']]
        : report.allocations.map((allocation) => [
            allocation.inventoryName ?? '—',
            allocation.eventName ?? '—',
            allocation.clientName ?? '—',
            String(allocation.quantityAllocated ?? 0),
            String(allocation.quantityReturned ?? 0),
            allocation.eventStatus ?? '—',
            money(allocation.totalCost),
          ]),
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      6: { halign: 'right' },
    },
  })

  finalize(doc, `inventory-report-${fileDate()}.pdf`)
}
