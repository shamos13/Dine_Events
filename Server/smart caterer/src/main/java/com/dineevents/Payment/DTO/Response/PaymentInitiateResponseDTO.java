package com.dineevents.Payment.DTO.Response;

import lombok.Data;

@Data
public class PaymentInitiateResponseDTO {
    private Long paymentId;
    private String checkoutRequestId;
    private String customerMessage;
}
