package com.dineevents.Payment.Controller;

import com.dineevents.Payment.DTO.Mpesa.StkCallbackPayload;
import com.dineevents.Payment.DTO.Request.ManualPaymentRequestDTO;
import com.dineevents.Payment.DTO.Request.PaymentInitiateRequestDTO;
import com.dineevents.Payment.DTO.Response.PaymentInitiateResponseDTO;
import com.dineevents.Payment.DTO.Response.PaymentResponseDTO;
import com.dineevents.Payment.DTO.Response.PaymentStatusResponseDTO;
import com.dineevents.Payment.Service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/mpesa/initiate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentInitiateResponseDTO> initiateMpesaPayment(
            @Valid @RequestBody PaymentInitiateRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(paymentService.initiateMpesaPayment(dto));
    }

    /**
     * Safaricom callback — permitAll in SecurityConfig. Always return 200 so Daraja
     * does not retry on parse/processing failures (retries can compound problems).
     */
    @PostMapping("/mpesa/callback")
    public ResponseEntity<Map<String, String>> mpesaCallback(
            @RequestBody(required = false) StkCallbackPayload payload) {
        try {
            if (payload != null && payload.getBody() != null && payload.getBody().getStkCallback() != null) {
                var cb = payload.getBody().getStkCallback();
                log.info("Received M-Pesa callback CheckoutRequestID={} ResultCode={} ResultDesc={}",
                        cb.getCheckoutRequestId(), cb.getResultCode(), cb.getResultDesc());
            } else {
                log.warn("Received M-Pesa callback with unexpected/empty body");
            }
            paymentService.handleMpesaCallback(payload);
        } catch (Exception ex) {
            log.error("M-Pesa callback processing failed; acknowledging to Safaricom anyway", ex);
        }
        return ResponseEntity.ok(Map.of("ResultCode", "0", "ResultDesc", "Accepted"));
    }

    @PostMapping("/manual")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentResponseDTO> recordManualPayment(
            @Valid @RequestBody ManualPaymentRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.recordManualPayment(dto));
    }

    @GetMapping("/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PaymentResponseDTO>> getRecentPayments() {
        return ResponseEntity.ok(paymentService.getRecentPayments());
    }

    @GetMapping("/{paymentId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentStatusResponseDTO> getPaymentStatus(@PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentStatus(paymentId));
    }
}
