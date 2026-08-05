package com.dineevents.Payment.DTO.Request;

import com.dineevents.Payment.Enum.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ManualPaymentRequestDTO {

    @NotNull(message = "Invoice Id is required")
    private Long invoiceId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than 0")
    private BigDecimal amount;

    // Expected to be CASH or BANK — MPESA payments should go through the
    // /mpesa/initiate flow instead, not be logged manually.
    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;
}
