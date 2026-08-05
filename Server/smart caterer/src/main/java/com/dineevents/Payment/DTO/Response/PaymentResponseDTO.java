package com.dineevents.Payment.DTO.Response;

import com.dineevents.Payment.Enum.PaymentMethod;
import com.dineevents.Payment.Enum.PaymentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
public class PaymentResponseDTO {
    private Long paymentId;
    private String invoiceNumber;
    private String eventName;
    private String clientName;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String mpesaReceiptNumber;
    private String checkoutRequestId;
    private String phoneNumber;
    private String failureReason;
    private OffsetDateTime initiatedAt;
    private OffsetDateTime completedAt;
}
