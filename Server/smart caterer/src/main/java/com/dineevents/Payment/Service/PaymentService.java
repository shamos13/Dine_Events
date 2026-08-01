package com.dineevents.Payment.Service;

import com.dineevents.Invoice.Entity.Invoice;
import com.dineevents.Invoice.Repository.InvoiceRepository;
import com.dineevents.Invoice.Service.InvoiceService;
import com.dineevents.Payment.DTO.Mpesa.StkCallbackPayload;
import com.dineevents.Payment.DTO.Mpesa.StkPushQueryResponse;
import com.dineevents.Payment.DTO.Mpesa.StkPushResponse;
import com.dineevents.Payment.DTO.Request.ManualPaymentRequestDTO;
import com.dineevents.Payment.DTO.Request.PaymentInitiateRequestDTO;
import com.dineevents.Payment.DTO.Response.PaymentInitiateResponseDTO;
import com.dineevents.Payment.DTO.Response.PaymentResponseDTO;
import com.dineevents.Payment.DTO.Response.PaymentStatusResponseDTO;
import com.dineevents.Payment.Entity.Payment;
import com.dineevents.Payment.Enum.PaymentMethod;
import com.dineevents.Payment.Enum.PaymentStatus;
import com.dineevents.Payment.Repository.PaymentRepository;
import com.dineevents.event.Entity.Event;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
public class PaymentService {

    private static final int DUPLICATE_PENDING_WINDOW_MINUTES = 2;
    /** Background job: STK-query payments older than this. */
    private static final int STALE_PENDING_SECONDS = 8;
    /** Status-poll path: start querying Safaricom quickly after the PIN prompt. */
    private static final int POLL_RECONCILE_AFTER_SECONDS = 2;
    /** Aggressive follow-up probes after STK initiate (seconds). */
    private static final long[] FOLLOW_UP_DELAYS_SECONDS = {3, 5, 8, 12, 18, 25, 35, 50};

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;
    private final MpesaService mpesaService;
    private final ThreadPoolTaskScheduler paymentTaskScheduler;

    public PaymentService(
            PaymentRepository paymentRepository,
            InvoiceRepository invoiceRepository,
            InvoiceService invoiceService,
            MpesaService mpesaService,
            @Qualifier("paymentTaskScheduler") ThreadPoolTaskScheduler paymentTaskScheduler
    ) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceService = invoiceService;
        this.mpesaService = mpesaService;
        this.paymentTaskScheduler = paymentTaskScheduler;
    }

    @Transactional
    public PaymentInitiateResponseDTO initiateMpesaPayment(PaymentInitiateRequestDTO dto) {
        Invoice invoice = invoiceRepository.findById(dto.getInvoiceId())
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + dto.getInvoiceId()));
        return doInitiateMpesa(invoice, dto.getAmount(), dto.getPhoneNumber());
    }

    /**
     * Portal entry-point: invoice ownership is verified by the caller before this is invoked.
     */
    @Transactional
    public PaymentResponseDTO initiateMpesaPayment(Invoice invoice, BigDecimal amount, String phoneNumber) {
        PaymentInitiateResponseDTO initiated = doInitiateMpesa(invoice, amount, phoneNumber);
        Payment payment = paymentRepository.findById(initiated.getPaymentId())
                .orElseThrow(() -> new EntityNotFoundException("Payment not found: " + initiated.getPaymentId()));
        return toResponseDTO(payment);
    }

    private PaymentInitiateResponseDTO doInitiateMpesa(Invoice invoice, BigDecimal amount, String phoneNumber) {
        assertAmountWithinBalance(invoice, amount);
        assertNoRecentPendingPayment(invoice.getInvoiceId());

        String normalizedPhone = normalizePhone(phoneNumber);
        StkPushResponse stkResponse = mpesaService.initiateStkPush(
                normalizedPhone, amount, invoice.getInvoiceNumber());

        if (stkResponse == null || stkResponse.getCheckoutRequestId() == null) {
            String reason = stkResponse != null ? stkResponse.getErrorMessage() : "No response from M-Pesa";
            throw new IllegalStateException("Failed to initiate M-Pesa payment: " + reason);
        }

        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setAmount(amount);
        payment.setPaymentMethod(PaymentMethod.MPESA);
        payment.setPaymentStatus(PaymentStatus.PENDING);
        payment.setPhoneNumber(normalizedPhone);
        payment.setCheckoutRequestId(stkResponse.getCheckoutRequestId());
        payment.setMerchantRequestId(stkResponse.getMerchantRequestId());

        Payment saved = paymentRepository.save(payment);
        log.info("Payment state transition: paymentId={}, invoiceId={}, null → PENDING, timestamp={}",
                saved.getPaymentId(), invoice.getInvoiceId(), saved.getInitiatedAt());

        // Don't wait for client polling or the slow cron — probe Safaricom automatically.
        scheduleStkFollowUps(saved.getPaymentId());

        PaymentInitiateResponseDTO response = new PaymentInitiateResponseDTO();
        response.setPaymentId(saved.getPaymentId());
        response.setCheckoutRequestId(saved.getCheckoutRequestId());
        response.setCustomerMessage(stkResponse.getCustomerMessage());
        return response;
    }

    private void scheduleStkFollowUps(Long paymentId) {
        if (!mpesaService.isEnabled()) {
            return;
        }
        for (long delaySec : FOLLOW_UP_DELAYS_SECONDS) {
            paymentTaskScheduler.schedule(
                    () -> {
                        try {
                            reconcilePaymentById(paymentId);
                        } catch (Exception ex) {
                            log.warn("STK follow-up failed for paymentId={}: {}", paymentId, ex.getMessage());
                        }
                    },
                    Instant.now().plusSeconds(delaySec)
            );
        }
        log.info("Scheduled {} STK follow-ups for paymentId={}", FOLLOW_UP_DELAYS_SECONDS.length, paymentId);
    }

    @Transactional
    public void reconcilePaymentById(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId).orElse(null);
        if (payment == null || payment.getPaymentStatus() != PaymentStatus.PENDING) {
            return;
        }
        reconcileOne(payment);
    }

    /**
     * Safaricom callback handler. Malformed/unknown payloads are logged and ignored
     * (no throw). Unexpected failures propagate so the transaction rolls back; the
     * controller still returns HTTP 200 so Daraja does not retry aggressively.
     */
    @Transactional
    public void handleMpesaCallback(StkCallbackPayload payload) {
        if (payload == null || payload.getBody() == null || payload.getBody().getStkCallback() == null) {
            log.warn("Ignoring malformed M-Pesa callback: missing Body/stkCallback");
            return;
        }

        StkCallbackPayload.StkCallback callback = payload.getBody().getStkCallback();
        String checkoutRequestId = callback.getCheckoutRequestId();
        if (checkoutRequestId == null || checkoutRequestId.isBlank()) {
            log.warn("Ignoring M-Pesa callback with missing CheckoutRequestID");
            return;
        }

        Payment payment = paymentRepository.findByCheckoutRequestId(checkoutRequestId).orElse(null);
        if (payment == null) {
            log.warn("No payment found for CheckoutRequestID: {}", checkoutRequestId);
            return;
        }

        // Idempotency — never double-credit. Late callbacks may still carry the real
        // MpesaReceiptNumber after we completed via STK query (which does not return it).
        if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
            if (callback.isSuccess()) {
                backfillReceiptFromCallback(payment, callback);
            } else {
                log.warn("Ignoring duplicate/late callback for CheckoutRequestID: {} (status={})",
                        checkoutRequestId, payment.getPaymentStatus());
            }
            return;
        }

        if (callback.isSuccess()) {
            String receipt = extractReceiptNumber(callback);
            if (!isValidMpesaReceipt(receipt)) {
                log.error("Successful M-Pesa callback for CheckoutRequestID {} missing valid MpesaReceiptNumber — metadata={}",
                        checkoutRequestId, callback.getCallbackMetadata());
            }
            completeMpesaPayment(payment, receipt, extractPhoneNumber(callback));
        } else {
            failMpesaPayment(payment, callback.getResultDesc());
        }
    }

    @Transactional
    public PaymentResponseDTO recordManualPayment(ManualPaymentRequestDTO dto) {
        Invoice invoice = invoiceRepository.findById(dto.getInvoiceId())
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + dto.getInvoiceId()));

        assertAmountWithinBalance(invoice, dto.getAmount());

        if (dto.getPaymentMethod() == PaymentMethod.MPESA) {
            throw new IllegalArgumentException("M-Pesa payments must go through the STK initiate flow");
        }

        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setAmount(dto.getAmount());
        payment.setPaymentMethod(dto.getPaymentMethod());
        payment.setPaymentStatus(PaymentStatus.COMPLETED);
        payment.setCompletedAt(OffsetDateTime.now());

        Payment saved = paymentRepository.save(payment);
        invoiceService.applyPayment(invoice.getInvoiceId(), dto.getAmount());

        log.info("Payment state transition: paymentId={}, invoiceId={}, null → COMPLETED, timestamp={}",
                saved.getPaymentId(), invoice.getInvoiceId(), saved.getCompletedAt());

        return toResponseDTO(saved);
    }

    public List<PaymentResponseDTO> getRecentPayments() {
        return paymentRepository.findTop20ByOrderByInitiatedAtDesc()
                .stream().map(this::toResponseDTO).toList();
    }

    /**
     * Client-scoped status poll. While PENDING, proactively STK-queries Safaricom so the
     * portal does not depend solely on the (often unreachable) callback tunnel.
     */
    @Transactional
    public PaymentStatusResponseDTO getPaymentStatus(Long paymentId, Long clientId) {
        Payment payment = paymentRepository.findByPaymentIdAndClientId(paymentId, clientId)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found"));
        maybeReconcileDuringPoll(payment);
        Payment fresh = paymentRepository.findById(paymentId).orElse(payment);
        return toStatusDTO(fresh);
    }

    /** Admin status poll — no client ownership filter. */
    @Transactional
    public PaymentStatusResponseDTO getPaymentStatus(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found: " + paymentId));
        maybeReconcileDuringPoll(payment);
        Payment fresh = paymentRepository.findById(paymentId).orElse(payment);
        return toStatusDTO(fresh);
    }

    /**
     * When the Safaricom callback never reaches us (common with free ngrok), the client
     * can attach the receipt code from their M-Pesa SMS so payment history stays auditable.
     */
    @Transactional
    public PaymentStatusResponseDTO confirmMpesaReceipt(Long paymentId, Long clientId, String rawReceipt) {
        Payment payment = paymentRepository.findByPaymentIdAndClientId(paymentId, clientId)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found"));

        if (payment.getPaymentStatus() != PaymentStatus.COMPLETED) {
            throw new IllegalStateException("Only completed payments can receive an M-Pesa receipt");
        }
        if (isValidMpesaReceipt(payment.getMpesaReceiptNumber())) {
            return toStatusDTO(payment);
        }

        String receipt = normalizeReceipt(rawReceipt);
        if (receipt == null) {
            throw new IllegalArgumentException(
                    "Enter the M-Pesa receipt from your SMS (e.g. NLJ7RT61SV), not the checkout request id");
        }

        paymentRepository.findByMpesaReceiptNumberIgnoreCase(receipt).ifPresent(existing -> {
            if (!existing.getPaymentId().equals(paymentId)) {
                throw new IllegalArgumentException("That M-Pesa receipt is already recorded on another payment");
            }
        });

        payment.setMpesaReceiptNumber(receipt);
        paymentRepository.save(payment);
        log.info("Client confirmed MpesaReceiptNumber={} for paymentId={}, invoiceId={}",
                receipt, payment.getPaymentId(), payment.getInvoice().getInvoiceId());
        return toStatusDTO(payment);
    }

    private PaymentStatusResponseDTO toStatusDTO(Payment payment) {
        PaymentStatusResponseDTO dto = new PaymentStatusResponseDTO();
        dto.setPaymentStatus(payment.getPaymentStatus());
        String receipt = isValidMpesaReceipt(payment.getMpesaReceiptNumber())
                ? payment.getMpesaReceiptNumber()
                : null;
        dto.setMpesaReceiptNumber(receipt);
        dto.setReceiptConfirmed(receipt != null);
        dto.setCheckoutRequestId(payment.getCheckoutRequestId());
        dto.setFailureReason(payment.getFailureReason());
        return dto;
    }

    private void maybeReconcileDuringPoll(Payment payment) {
        if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
            return;
        }
        if (payment.getInitiatedAt() == null
                || payment.getInitiatedAt().isAfter(OffsetDateTime.now().minusSeconds(POLL_RECONCILE_AFTER_SECONDS))) {
            return;
        }
        if (!mpesaService.isEnabled()) {
            return;
        }
        reconcileOne(payment);
    }

    /**
     * Simulated 75% refund on event cancellation. Creates a REFUNDED payment row for audit.
     */
    @Transactional
    public Payment processCancellationRefund(Event event) {
        List<Invoice> invoices = invoiceRepository.findByEvent_EventId(event.getEventId());
        BigDecimal totalPaid = invoices.stream()
                .map(i -> i.getAmountPaid() != null ? i.getAmountPaid() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPaid.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        Invoice invoice = invoices.stream()
                .filter(i -> i.getAmountPaid() != null && i.getAmountPaid().compareTo(BigDecimal.ZERO) > 0)
                .findFirst()
                .orElse(invoices.get(0));

        BigDecimal refundAmount = totalPaid.multiply(new BigDecimal("0.75")).setScale(2, RoundingMode.HALF_UP);

        Payment refund = new Payment();
        refund.setInvoice(invoice);
        refund.setAmount(refundAmount);
        refund.setPaymentMethod(PaymentMethod.MPESA);
        refund.setPaymentStatus(PaymentStatus.REFUNDED);
        refund.setMpesaReceiptNumber("REF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        refund.setCompletedAt(OffsetDateTime.now());
        refund.setFailureReason("Simulated 75% cancellation refund");

        Payment saved = paymentRepository.save(refund);
        log.info("Payment state transition: paymentId={}, invoiceId={}, null → REFUNDED, timestamp={}",
                saved.getPaymentId(), invoice.getInvoiceId(), saved.getCompletedAt());
        return saved;
    }

    /**
     * Resolve PENDING (and wrongly-FAILED "still processing") payments via STK Push Query.
     */
    @Transactional
    public void reconcileStalePendingPayments() {
        if (!mpesaService.isEnabled()) {
            return;
        }

        OffsetDateTime staleBefore = OffsetDateTime.now().minusSeconds(STALE_PENDING_SECONDS);
        List<Payment> stale = paymentRepository.findByPaymentStatusAndInitiatedAtBefore(
                PaymentStatus.PENDING, staleBefore);

        // Revive payments we prematurely marked FAILED while Daraja was still processing.
        List<Payment> prematureFails = paymentRepository.findByPaymentStatus(PaymentStatus.FAILED).stream()
                .filter(p -> p.getFailureReason() != null
                        && isStillProcessingMessage(p.getFailureReason())
                        && p.getCheckoutRequestId() != null)
                .toList();

        if (stale.isEmpty() && prematureFails.isEmpty()) {
            return;
        }

        log.info("Reconciling {} stale PENDING and {} premature FAILED payment(s)",
                stale.size(), prematureFails.size());

        for (Payment payment : stale) {
            try {
                reconcileOne(payment);
            } catch (Exception ex) {
                log.error("Failed to reconcile paymentId={}", payment.getPaymentId(), ex);
            }
        }
        for (Payment payment : prematureFails) {
            try {
                // Flip back to PENDING so reconcileOne can complete/fail cleanly
                payment.setPaymentStatus(PaymentStatus.PENDING);
                payment.setFailureReason(null);
                payment.setCompletedAt(null);
                paymentRepository.save(payment);
                reconcileOne(payment);
            } catch (Exception ex) {
                log.error("Failed to re-reconcile premature FAILED paymentId={}", payment.getPaymentId(), ex);
            }
        }
    }

    private void reconcileOne(Payment payment) {
        if (payment.getCheckoutRequestId() == null || payment.getCheckoutRequestId().isBlank()) {
            failMpesaPayment(payment, "Stale PENDING with no CheckoutRequestID");
            return;
        }

        StkPushQueryResponse query = mpesaService.queryStkPush(payment.getCheckoutRequestId());
        if (query == null) {
            return;
        }

        String resultCode = query.getResultCode() != null ? query.getResultCode().trim() : null;
        String resultDesc = firstNonBlank(query.getResultDesc(), query.getErrorMessage());
        String errorCode = query.getErrorCode();

        // Still in flight — leave PENDING (do NOT mark FAILED).
        if (resultCode == null || resultCode.isBlank()) {
            String msg = firstNonBlank(resultDesc, query.getErrorMessage());
            if (isStillProcessingMessage(msg)) {
                log.info("STK query for paymentId={} still in flight (errorCode={}, msg={})",
                        payment.getPaymentId(), errorCode, msg);
                return;
            }
            // Expired / unknown checkout — fail so the client can retry.
            if (msg != null && msg.toLowerCase(Locale.ROOT).contains("does not exist")) {
                failMpesaPayment(payment, msg);
                return;
            }
            log.info("STK query for paymentId={} unresolved (errorCode={}, msg={})",
                    payment.getPaymentId(), errorCode, msg);
            return;
        }

        if (isStillProcessingMessage(resultDesc)) {
            log.info("STK query for paymentId={} still processing (ResultCode={}, desc={})",
                    payment.getPaymentId(), resultCode, resultDesc);
            return;
        }

        Payment fresh = paymentRepository.findById(payment.getPaymentId()).orElse(null);
        if (fresh == null || fresh.getPaymentStatus() != PaymentStatus.PENDING) {
            return;
        }

        if ("0".equals(resultCode)) {
            // STK query confirms success but NEVER returns MpesaReceiptNumber.
            // Complete + credit the invoice now; late callback will backfill the real receipt.
            completeMpesaPayment(fresh, null, fresh.getPhoneNumber());
        } else {
            failMpesaPayment(fresh, resultDesc != null
                    ? resultDesc
                    : "STK query ResultCode=" + resultCode);
        }
    }

    private void completeMpesaPayment(Payment payment, String receiptNumber, String phoneFromCallback) {
        PaymentStatus from = payment.getPaymentStatus();
        payment.setPaymentStatus(PaymentStatus.COMPLETED);
        payment.setCompletedAt(OffsetDateTime.now());

        String validReceipt = normalizeReceipt(receiptNumber);
        if (validReceipt != null) {
            payment.setMpesaReceiptNumber(validReceipt);
        }
        // Never invent a fake receipt (e.g. CHK-...). Payment history must only show
        // genuine Safaricom MpesaReceiptNumber values for cross-checking.

        if (phoneFromCallback != null && !phoneFromCallback.isBlank()) {
            payment.setPhoneNumber(normalizePhone(phoneFromCallback));
        }
        // Clear "awaiting receipt" style notes once we have a real one
        if (validReceipt != null
                && payment.getFailureReason() != null
                && payment.getFailureReason().toLowerCase(Locale.ROOT).contains("receipt")) {
            payment.setFailureReason(null);
        }
        paymentRepository.save(payment);

        creditInvoiceSafely(payment);

        if (validReceipt == null) {
            log.warn("Payment {} COMPLETED without MpesaReceiptNumber yet — awaiting late callback backfill",
                    payment.getPaymentId());
        }

        log.info("Payment state transition: paymentId={}, invoiceId={}, {} → COMPLETED, timestamp={}, receipt={}",
                payment.getPaymentId(),
                payment.getInvoice().getInvoiceId(),
                from,
                payment.getCompletedAt(),
                payment.getMpesaReceiptNumber());
    }

    /**
     * Apply a genuine MpesaReceiptNumber from a late/replayed callback without re-crediting.
     */
    private void backfillReceiptFromCallback(Payment payment, StkCallbackPayload.StkCallback callback) {
        String receipt = normalizeReceipt(extractReceiptNumber(callback));
        if (receipt == null) {
            log.warn("Late callback for paymentId={} had no valid MpesaReceiptNumber", payment.getPaymentId());
            return;
        }
        if (isValidMpesaReceipt(payment.getMpesaReceiptNumber())) {
            if (!receipt.equalsIgnoreCase(payment.getMpesaReceiptNumber())) {
                log.warn("Late callback receipt {} differs from stored {} for paymentId={}",
                        receipt, payment.getMpesaReceiptNumber(), payment.getPaymentId());
            }
            return;
        }

        payment.setMpesaReceiptNumber(receipt);
        String phone = extractPhoneNumber(callback);
        if (phone != null && !phone.isBlank()) {
            payment.setPhoneNumber(normalizePhone(phone));
        }
        if (payment.getFailureReason() != null
                && payment.getFailureReason().toLowerCase(Locale.ROOT).contains("receipt")) {
            payment.setFailureReason(null);
        }
        paymentRepository.save(payment);
        log.info("Backfilled MpesaReceiptNumber={} onto paymentId={}, invoiceId={}, timestamp={}",
                receipt, payment.getPaymentId(), payment.getInvoice().getInvoiceId(), OffsetDateTime.now());
    }

    private void creditInvoiceSafely(Payment payment) {
        Long invoiceId = payment.getInvoice().getInvoiceId();
        Invoice invoice = invoiceRepository.findByIdForUpdate(invoiceId).orElse(null);
        if (invoice == null) {
            log.error("Invoice {} missing while completing payment {}", invoiceId, payment.getPaymentId());
            return;
        }

        BigDecimal balance = invoice.getBalance() != null ? invoice.getBalance() : BigDecimal.ZERO;
        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            payment.setFailureReason("M-Pesa confirmed; invoice already settled — review for refund");
            paymentRepository.save(payment);
            log.warn("Payment {} completed at M-Pesa but invoice {} is already settled",
                    payment.getPaymentId(), invoiceId);
            return;
        }

        BigDecimal credit = payment.getAmount().min(balance);
        // applyPayment re-locks the same row in this transaction — safe on Postgres.
        invoiceService.applyPayment(invoiceId, credit);

        if (credit.compareTo(payment.getAmount()) < 0) {
            payment.setFailureReason(
                    "Partial credit applied — M-Pesa amount exceeded remaining balance");
            paymentRepository.save(payment);
            log.warn("Payment {} partially credited {} of {} to invoice {}",
                    payment.getPaymentId(), credit, payment.getAmount(), invoiceId);
        }
    }

    private void failMpesaPayment(Payment payment, String reason) {
        if (isStillProcessingMessage(reason)) {
            log.info("Not failing paymentId={} — Safaricom reports still processing: {}",
                    payment.getPaymentId(), reason);
            return;
        }

        PaymentStatus from = payment.getPaymentStatus();
        payment.setPaymentStatus(PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        payment.setCompletedAt(OffsetDateTime.now());
        paymentRepository.save(payment);

        log.info("Payment state transition: paymentId={}, invoiceId={}, {} → FAILED, timestamp={}, reason={}",
                payment.getPaymentId(),
                payment.getInvoice().getInvoiceId(),
                from,
                payment.getCompletedAt(),
                reason);
    }

    private void assertAmountWithinBalance(Invoice invoice, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }
        BigDecimal balance = invoice.getBalance() != null ? invoice.getBalance() : BigDecimal.ZERO;
        if (amount.compareTo(balance) > 0) {
            throw new IllegalArgumentException(
                    "Payment amount " + amount + " exceeds invoice balance of " + balance);
        }
    }

    private void assertNoRecentPendingPayment(Long invoiceId) {
        OffsetDateTime windowStart = OffsetDateTime.now().minusMinutes(DUPLICATE_PENDING_WINDOW_MINUTES);
        paymentRepository
                .findFirstByInvoice_InvoiceIdAndPaymentStatusAndInitiatedAtAfterOrderByInitiatedAtDesc(
                        invoiceId, PaymentStatus.PENDING, windowStart)
                .ifPresent(existing -> {
                    throw new IllegalStateException(
                            "A payment is already pending for this invoice (paymentId="
                                    + existing.getPaymentId()
                                    + "). Please wait for it to complete or fail before starting another.");
                });
    }

    private String extractReceiptNumber(StkCallbackPayload.StkCallback callback) {
        String exact = extractMetadataValue(callback, "MpesaReceiptNumber");
        if (exact != null) {
            return exact;
        }
        // Fallbacks for slightly different metadata naming from Daraja variants
        if (callback.getCallbackMetadata() == null || callback.getCallbackMetadata().getItem() == null) {
            return null;
        }
        for (StkCallbackPayload.CallbackItem item : callback.getCallbackMetadata().getItem()) {
            if (item == null || item.getName() == null || item.getValue() == null) {
                continue;
            }
            String name = item.getName().replace("_", "").replace(" ", "");
            if (name.equalsIgnoreCase("MpesaReceiptNumber") || name.toLowerCase(Locale.ROOT).contains("receipt")) {
                return String.valueOf(item.getValue());
            }
        }
        return null;
    }

    private String extractPhoneNumber(StkCallbackPayload.StkCallback callback) {
        return extractMetadataValue(callback, "PhoneNumber");
    }

    private String extractMetadataValue(StkCallbackPayload.StkCallback callback, String name) {
        if (callback.getCallbackMetadata() == null || callback.getCallbackMetadata().getItem() == null) {
            return null;
        }
        for (StkCallbackPayload.CallbackItem item : callback.getCallbackMetadata().getItem()) {
            if (item == null || item.getName() == null || item.getValue() == null) {
                continue;
            }
            if (name.equalsIgnoreCase(item.getName())) {
                return String.valueOf(item.getValue());
            }
        }
        return null;
    }

    /** Safaricom receipt codes are short alphanumeric tokens (e.g. RB15P0ICDO) — never CheckoutRequestIDs. */
    public static boolean isValidMpesaReceipt(String receipt) {
        if (receipt == null || receipt.isBlank()) {
            return false;
        }
        String trimmed = receipt.trim();
        if (trimmed.regionMatches(true, 0, "CHK-", 0, 4)) {
            return false;
        }
        if (trimmed.regionMatches(true, 0, "ws_CO_", 0, 6)) {
            return false;
        }
        return trimmed.matches("(?i)^[A-Z0-9]{8,15}$");
    }

    private static String normalizeReceipt(String receipt) {
        if (!isValidMpesaReceipt(receipt)) {
            return null;
        }
        return receipt.trim().toUpperCase(Locale.ROOT);
    }

    private static boolean isStillProcessingMessage(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }
        String lower = message.toLowerCase(Locale.ROOT);
        return lower.contains("still under processing")
                || lower.contains("still processing")
                || lower.contains("being processed");
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a;
        }
        if (b != null && !b.isBlank()) {
            return b;
        }
        return null;
    }

    private static String normalizePhone(String phoneNumber) {
        if (phoneNumber == null) {
            return null;
        }
        String digitsOnly = phoneNumber.replaceAll("[^0-9]", "");
        if (digitsOnly.startsWith("0")) {
            return "254" + digitsOnly.substring(1);
        }
        if (digitsOnly.startsWith("254")) {
            return digitsOnly;
        }
        if (digitsOnly.startsWith("7") || digitsOnly.startsWith("1")) {
            return "254" + digitsOnly;
        }
        return digitsOnly;
    }

    public PaymentResponseDTO toResponseDTO(Payment payment) {
        PaymentResponseDTO dto = new PaymentResponseDTO();
        dto.setPaymentId(payment.getPaymentId());
        dto.setInvoiceNumber(payment.getInvoice().getInvoiceNumber());
        dto.setEventName(payment.getInvoice().getEvent().getEventName());
        if (payment.getInvoice().getEvent().getClient() != null) {
            dto.setClientName(payment.getInvoice().getEvent().getClient().getFirstName()
                    + " " + payment.getInvoice().getEvent().getClient().getLastName());
        }
        dto.setAmount(payment.getAmount());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setPaymentStatus(payment.getPaymentStatus());
        dto.setMpesaReceiptNumber(isValidMpesaReceipt(payment.getMpesaReceiptNumber())
                ? payment.getMpesaReceiptNumber()
                : null);
        dto.setCheckoutRequestId(payment.getCheckoutRequestId());
        dto.setPhoneNumber(payment.getPhoneNumber());
        dto.setFailureReason(payment.getFailureReason());
        dto.setInitiatedAt(payment.getInitiatedAt());
        dto.setCompletedAt(payment.getCompletedAt());
        return dto;
    }
}
