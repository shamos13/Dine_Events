package com.dineevents.Payment.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Safety net when STK callbacks never arrive (ngrok down, network drop).
 * Primary fast path is the scheduled follow-ups kicked off at initiate-time;
 * this job catches anything still PENDING.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PendingPaymentReconciliationJob {

    private final PaymentService paymentService;

    @Scheduled(fixedDelayString = "${app.mpesa.reconcile-delay-ms:10000}")
    public void reconcileStalePendingPayments() {
        try {
            paymentService.reconcileStalePendingPayments();
        } catch (Exception ex) {
            log.error("Pending payment reconciliation run failed", ex);
        }
    }
}
