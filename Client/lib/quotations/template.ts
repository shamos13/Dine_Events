import type { QuotationTemplateData } from '@/components/QuotationTemplate'

type QuotationLike = {
  quotationNumber: string
  quotationName: string
  createdAt: string
  validUntil?: string | null
  quotationStatus: string
  clientName?: string | null
  clientPhone?: string | null
  clientEmail?: string | null
  eventName: string
  subTotal?: number
  discountPercent?: number | null
  discountAmount?: number | null
  discountReason?: string | null
  total: number
  lineItems: Array<{
    lineItemId: number
    lineItemDescription: string
    lineItemType: string
    quantity: number
    unitPriceAtQuotation: number
    totalPrice: number
  }>
}

/** Shared mapper so admin billing and portal quote review use the same template shape. */
export function quotationToTemplateData(
  quotation: QuotationLike,
  extras?: Partial<QuotationTemplateData>
): QuotationTemplateData {
  const discountPercent = Number(quotation.discountPercent ?? 0)
  const discountAmount =
    quotation.discountAmount != null
      ? Number(quotation.discountAmount)
      : Number(quotation.subTotal ?? 0) * (discountPercent / 100)
  return {
    quotationNumber: quotation.quotationNumber,
    quotationName: quotation.quotationName,
    issueDate: quotation.createdAt,
    validUntil: quotation.validUntil ?? undefined,
    status: quotation.quotationStatus.replaceAll('_', ' '),
    clientName: quotation.clientName ?? undefined,
    clientContact: quotation.clientPhone ?? undefined,
    clientEmail: quotation.clientEmail ?? undefined,
    eventName: quotation.eventName,
    lineItems: quotation.lineItems.map((item) => ({
      id: item.lineItemId,
      description: item.lineItemDescription,
      subdescription: item.lineItemType.replaceAll('_', ' '),
      qty: item.quantity,
      unitPrice: item.unitPriceAtQuotation,
      total: item.totalPrice,
      type: item.lineItemType,
    })),
    subtotal: Number(quotation.subTotal ?? 0),
    discountPercent,
    discountAmount,
    discountReason: quotation.discountReason ?? undefined,
    total: Number(quotation.total ?? 0),
    ...extras,
  }
}
