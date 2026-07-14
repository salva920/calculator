export const CANCELLED_STATUSES = ['CANCELLED', 'CANCELLED_BY_SYSTEM'] as const
export const IN_PROGRESS_STATUSES = [
  'TRADING',
  'BUYER_PAYED',
  'APPEALING',
  'PARTIAL_COMPLETED',
] as const

export function normalizeOrderStatus(status: string): string {
  return (status || '').toString().toUpperCase()
}

export function isCompletedStatus(status: string): boolean {
  return normalizeOrderStatus(status) === 'COMPLETED'
}

export function isCancelledStatus(status: string): boolean {
  return CANCELLED_STATUSES.includes(normalizeOrderStatus(status) as (typeof CANCELLED_STATUSES)[number])
}

export function isInProgressStatus(status: string): boolean {
  return IN_PROGRESS_STATUSES.includes(normalizeOrderStatus(status) as (typeof IN_PROGRESS_STATUSES)[number])
}
