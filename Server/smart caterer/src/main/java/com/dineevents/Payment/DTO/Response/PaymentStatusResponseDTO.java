package com.dineevents.Payment.DTO.Response;

import com.dineevents.Payment.Enum.PaymentStatus;
import lombok.Data;

@Data
public class PaymentStatusResponseDTO {
    private PaymentStatus paymentStatus;
    /** Genuine Safaricom MpesaReceiptNumber only — never a synthetic placeholder. */
    private String mpesaReceiptNumber;
    /** True when {@link #mpesaReceiptNumber} is a valid Safaricom receipt code. */
    private boolean receiptConfirmed;
    /** CheckoutRequestID — correlation id only; not a customer-facing receipt. */
    private String checkoutRequestId;
    private String failureReason;
}
