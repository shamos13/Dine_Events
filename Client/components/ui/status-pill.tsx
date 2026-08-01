import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  INQUIRY: 'bg-purple-100 text-purple-700',
  TENTATIVE: 'bg-orange-100 text-orange-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-600',
  PAID: 'bg-green-100 text-green-700',
  UNPAID: 'bg-amber-100 text-amber-800',
  PARTIALLY_PAID: 'bg-orange-100 text-orange-700',
  OVERDUE: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUCCESS: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-indigo-100 text-indigo-700',
  OPEN: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
}

export function StatusPill({ status, className = '' }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        style,
        className
      )}
    >
      {status.replaceAll('_', ' ')}
    </span>
  )
}
