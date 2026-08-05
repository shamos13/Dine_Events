package com.dineevents.Quotation.Enum;

public enum QuotationStatus {
    DRAFT,
    SENT,
    ACCEPTED,
    REJECTED,
    EXPIRED,
    /** Replaced by a newer proposal after adjustments. Not acceptable by the client. */
    SUPERSEDED
}
