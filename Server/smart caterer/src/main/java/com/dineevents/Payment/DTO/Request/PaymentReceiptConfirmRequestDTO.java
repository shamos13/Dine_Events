package com.dineevents.Payment.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentReceiptConfirmRequestDTO {

    @NotBlank(message = "M-Pesa receipt number is required")
    private String mpesaReceiptNumber;
}
