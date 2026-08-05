package com.dineevents.Payment;

import com.dineevents.Invoice.Entity.Invoice;
import com.dineevents.Invoice.Enum.InvoiceStatus;
import com.dineevents.Invoice.Repository.InvoiceRepository;
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
import com.dineevents.Payment.Service.MpesaService;
import com.dineevents.Payment.Service.PaymentService;
import com.dineevents.auth.Entity.AppUser;
import com.dineevents.auth.Enum.Role;
import com.dineevents.auth.Repository.AppUserRepository;
import com.dineevents.client.Entity.Client;
import com.dineevents.client.Repository.ClientRepository;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Enums.EventStatus;
import com.dineevents.event.Repository.EventRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@SpringBootTest
@Transactional
class PaymentWorkflowIntegrationTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private AppUserRepository appUserRepository;

    @MockitoBean
    private MpesaService mpesaService;

    private Client ownerClient;
    private Client otherClient;
    private Invoice ownerInvoice;

    @BeforeEach
    void setUp() {
        ownerClient = persistClient("Alice", "Owner", "alice@example.com", "254700111111");
        otherClient = persistClient("Bob", "Other", "bob@example.com", "254700222222");

        Event ownerEvent = persistEvent(ownerClient, "Alice Wedding");
        ownerInvoice = persistInvoice(ownerEvent, "INV-TEST-001", new BigDecimal("10000.00"));

        persistUser("alice@example.com", Role.CLIENT, ownerClient);
        persistUser("bob@example.com", Role.CLIENT, otherClient);

        when(mpesaService.isEnabled()).thenReturn(false);
    }

    @Test
    void successfulPaymentZerosBalanceAndMarksPaid() {
        StkPushResponse stk = stkResponse("ws_CO_FULL_001");
        when(mpesaService.initiateStkPush(anyString(), any(), anyString())).thenReturn(stk);

        PaymentInitiateRequestDTO request = new PaymentInitiateRequestDTO();
        request.setInvoiceId(ownerInvoice.getInvoiceId());
        request.setPhoneNumber("254700111111");
        request.setAmount(new BigDecimal("10000.00"));

        PaymentInitiateResponseDTO initiated = paymentService.initiateMpesaPayment(request);
        paymentService.handleMpesaCallback(successCallback("ws_CO_FULL_001", "RCPFULL001"));

        Invoice updated = invoiceRepository.findById(ownerInvoice.getInvoiceId()).orElseThrow();
        Payment payment = paymentRepository.findById(initiated.getPaymentId()).orElseThrow();

        assertEquals(0, updated.getBalance().compareTo(BigDecimal.ZERO));
        assertEquals(0, updated.getAmountPaid().compareTo(new BigDecimal("10000.00")));
        assertEquals(InvoiceStatus.PAID, updated.getInvoiceStatus());
        assertEquals(PaymentStatus.COMPLETED, payment.getPaymentStatus());
        assertEquals("RCPFULL001", payment.getMpesaReceiptNumber());
        assertTrue(PaymentService.isValidMpesaReceipt(payment.getMpesaReceiptNumber()));
    }

    @Test
    void lateCallbackBackfillsRealReceiptWithoutDoubleCredit() {
        when(mpesaService.initiateStkPush(anyString(), any(), anyString()))
                .thenReturn(stkResponse("ws_CO_RECEIPT_001"));

        PaymentInitiateRequestDTO request = new PaymentInitiateRequestDTO();
        request.setInvoiceId(ownerInvoice.getInvoiceId());
        request.setPhoneNumber("254700111111");
        request.setAmount(new BigDecimal("3000.00"));

        PaymentInitiateResponseDTO initiated = paymentService.initiateMpesaPayment(request);

        // Simulate STK-query completion path (no receipt yet)
        Payment pending = paymentRepository.findById(initiated.getPaymentId()).orElseThrow();
        pending.setPaymentStatus(PaymentStatus.COMPLETED);
        pending.setCompletedAt(OffsetDateTime.now());
        pending.setMpesaReceiptNumber(null);
        paymentRepository.save(pending);
        invoiceRepository.findById(ownerInvoice.getInvoiceId()).ifPresent(inv -> {
            inv.setAmountPaid(new BigDecimal("3000.00"));
            inv.setBalance(new BigDecimal("7000.00"));
            inv.setInvoiceStatus(InvoiceStatus.PARTIALLY_PAID);
            invoiceRepository.save(inv);
        });

        paymentService.handleMpesaCallback(successCallback("ws_CO_RECEIPT_001", "NLJ7RT61SV"));

        Payment updated = paymentRepository.findById(initiated.getPaymentId()).orElseThrow();
        Invoice invoice = invoiceRepository.findById(ownerInvoice.getInvoiceId()).orElseThrow();

        assertEquals("NLJ7RT61SV", updated.getMpesaReceiptNumber());
        assertEquals(0, invoice.getAmountPaid().compareTo(new BigDecimal("3000.00")));
        assertTrue(PaymentService.isValidMpesaReceipt("NLJ7RT61SV"));
        assertFalse(PaymentService.isValidMpesaReceipt("CHK-ws_CO_RECEIPT_001"));
    }

    @Test
    void partialPaymentMarksPartiallyPaid() {
        ManualPaymentRequestDTO request = new ManualPaymentRequestDTO();
        request.setInvoiceId(ownerInvoice.getInvoiceId());
        request.setAmount(new BigDecimal("4000.00"));
        request.setPaymentMethod(PaymentMethod.CASH);

        paymentService.recordManualPayment(request);

        Invoice updated = invoiceRepository.findById(ownerInvoice.getInvoiceId()).orElseThrow();
        assertEquals(InvoiceStatus.PARTIALLY_PAID, updated.getInvoiceStatus());
        assertEquals(0, updated.getAmountPaid().compareTo(new BigDecimal("4000.00")));
        assertEquals(0, updated.getBalance().compareTo(new BigDecimal("6000.00")));
    }

    @Test
    void duplicateCallbackDoesNotDoubleCredit() {
        when(mpesaService.initiateStkPush(anyString(), any(), anyString()))
                .thenReturn(stkResponse("ws_CO_DUP_001"));

        PaymentInitiateRequestDTO request = new PaymentInitiateRequestDTO();
        request.setInvoiceId(ownerInvoice.getInvoiceId());
        request.setPhoneNumber("254700111111");
        request.setAmount(new BigDecimal("5000.00"));

        paymentService.initiateMpesaPayment(request);

        StkCallbackPayload callback = successCallback("ws_CO_DUP_001", "RCPDUP001");
        paymentService.handleMpesaCallback(callback);
        paymentService.handleMpesaCallback(callback);

        Invoice updated = invoiceRepository.findById(ownerInvoice.getInvoiceId()).orElseThrow();
        assertEquals(0, updated.getAmountPaid().compareTo(new BigDecimal("5000.00")));
        assertEquals(0, updated.getBalance().compareTo(new BigDecimal("5000.00")));
        assertEquals(InvoiceStatus.PARTIALLY_PAID, updated.getInvoiceStatus());

        List<Payment> completed = paymentRepository.findByPaymentStatus(PaymentStatus.COMPLETED);
        assertEquals(1, completed.size());
    }

    @Test
    void overpaymentIsRejectedForManualAndInitiate() {
        ManualPaymentRequestDTO manual = new ManualPaymentRequestDTO();
        manual.setInvoiceId(ownerInvoice.getInvoiceId());
        manual.setAmount(new BigDecimal("10000.01"));
        manual.setPaymentMethod(PaymentMethod.BANK);

        IllegalArgumentException manualEx = assertThrows(
                IllegalArgumentException.class,
                () -> paymentService.recordManualPayment(manual));
        assertTrue(manualEx.getMessage().toLowerCase().contains("exceeds"));

        when(mpesaService.initiateStkPush(anyString(), any(), anyString()))
                .thenReturn(stkResponse("ws_CO_OVER_001"));

        PaymentInitiateRequestDTO initiate = new PaymentInitiateRequestDTO();
        initiate.setInvoiceId(ownerInvoice.getInvoiceId());
        initiate.setPhoneNumber("254700111111");
        initiate.setAmount(new BigDecimal("15000.00"));

        IllegalArgumentException initiateEx = assertThrows(
                IllegalArgumentException.class,
                () -> paymentService.initiateMpesaPayment(initiate));
        assertTrue(initiateEx.getMessage().toLowerCase().contains("exceeds"));

        Invoice unchanged = invoiceRepository.findById(ownerInvoice.getInvoiceId()).orElseThrow();
        assertEquals(0, unchanged.getAmountPaid().compareTo(BigDecimal.ZERO));
        assertEquals(InvoiceStatus.UNPAID, unchanged.getInvoiceStatus());
    }

    @Test
    void crossClientCannotSeeOrPayOtherClientsInvoice() {
        // Ownership is enforced at the portal layer via invoice+client lookup
        assertTrue(invoiceRepository
                .findByInvoiceIdAndEvent_Client_ClientId(ownerInvoice.getInvoiceId(), otherClient.getClientId())
                .isEmpty());

        when(mpesaService.initiateStkPush(anyString(), any(), anyString()))
                .thenReturn(stkResponse("ws_CO_OWN_001"));

        PaymentResponseDTO initiated = paymentService.initiateMpesaPayment(
                ownerInvoice, new BigDecimal("1000.00"), "254700111111");

        EntityNotFoundException statusEx = assertThrows(
                EntityNotFoundException.class,
                () -> paymentService.getPaymentStatus(initiated.getPaymentId(), otherClient.getClientId()));
        assertEquals("Payment not found", statusEx.getMessage());

        PaymentStatusResponseDTO ownStatus = paymentService.getPaymentStatus(
                initiated.getPaymentId(), ownerClient.getClientId());
        assertEquals(PaymentStatus.PENDING, ownStatus.getPaymentStatus());
    }

    @Test
    void duplicateRecentPendingInitiateIsRejected() {
        when(mpesaService.isEnabled()).thenReturn(false);
        when(mpesaService.initiateStkPush(anyString(), any(), anyString()))
                .thenReturn(stkResponse("ws_CO_PEND_001"), stkResponse("ws_CO_PEND_002"));

        PaymentInitiateRequestDTO first = new PaymentInitiateRequestDTO();
        first.setInvoiceId(ownerInvoice.getInvoiceId());
        first.setPhoneNumber("254700111111");
        first.setAmount(new BigDecimal("1000.00"));
        paymentService.initiateMpesaPayment(first);

        PaymentInitiateRequestDTO second = new PaymentInitiateRequestDTO();
        second.setInvoiceId(ownerInvoice.getInvoiceId());
        second.setPhoneNumber("254700111111");
        second.setAmount(new BigDecimal("1000.00"));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> paymentService.initiateMpesaPayment(second));
        assertTrue(ex.getMessage().toLowerCase().contains("already pending"));
    }

    @Test
    void stalePendingOnSamePhoneIsReconciledBeforeNewInitiate() {
        when(mpesaService.isEnabled()).thenReturn(true);
        when(mpesaService.initiateStkPush(anyString(), any(), anyString()))
                .thenReturn(stkResponse("ws_CO_OLD_001"), stkResponse("ws_CO_NEW_002"));

        PaymentInitiateRequestDTO first = new PaymentInitiateRequestDTO();
        first.setInvoiceId(ownerInvoice.getInvoiceId());
        first.setPhoneNumber("254700111111");
        first.setAmount(new BigDecimal("1000.00"));
        paymentService.initiateMpesaPayment(first);

        Payment stale = paymentRepository.findByCheckoutRequestId("ws_CO_OLD_001").orElseThrow();
        stale.setInitiatedAt(OffsetDateTime.now().minusMinutes(11));
        paymentRepository.save(stale);

        when(mpesaService.queryStkPush("ws_CO_OLD_001")).thenReturn(stkQueryFailure("Request cancelled by user"));

        PaymentInitiateRequestDTO second = new PaymentInitiateRequestDTO();
        second.setInvoiceId(ownerInvoice.getInvoiceId());
        second.setPhoneNumber("254700111111");
        second.setAmount(new BigDecimal("1000.00"));

        PaymentInitiateResponseDTO retry = paymentService.initiateMpesaPayment(second);
        assertNotNull(retry.getPaymentId());

        Payment failedOld = paymentRepository.findByCheckoutRequestId("ws_CO_OLD_001").orElseThrow();
        assertEquals(PaymentStatus.FAILED, failedOld.getPaymentStatus());
    }

    @Test
    void mpesaInitiateErrorSurfacesAsConflictNotServerError() {
        when(mpesaService.isEnabled()).thenReturn(true);
        StkPushResponse error = new StkPushResponse();
        error.setErrorMessage("DS timeout user cannot be reached");
        when(mpesaService.initiateStkPush(anyString(), any(), anyString())).thenReturn(error);

        PaymentInitiateRequestDTO request = new PaymentInitiateRequestDTO();
        request.setInvoiceId(ownerInvoice.getInvoiceId());
        request.setPhoneNumber("254700111111");
        request.setAmount(new BigDecimal("1000.00"));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> paymentService.initiateMpesaPayment(request));
        assertTrue(ex.getMessage().contains("DS timeout user cannot be reached"));
        assertEquals(0, paymentRepository.findByInvoice_InvoiceIdOrderByInitiatedAtDesc(ownerInvoice.getInvoiceId()).size());
    }

    @Test
    void malformedCallbackDoesNotThrowAndLeavesInvoiceUntouched() {
        assertDoesNotThrow(() -> paymentService.handleMpesaCallback(null));
        assertDoesNotThrow(() -> paymentService.handleMpesaCallback(new StkCallbackPayload()));

        StkCallbackPayload emptyBody = new StkCallbackPayload();
        emptyBody.setBody(new StkCallbackPayload.CallbackBody());
        assertDoesNotThrow(() -> paymentService.handleMpesaCallback(emptyBody));

        Invoice unchanged = invoiceRepository.findById(ownerInvoice.getInvoiceId()).orElseThrow();
        assertEquals(0, unchanged.getAmountPaid().compareTo(BigDecimal.ZERO));
    }

    private Client persistClient(String first, String last, String email, String phone) {
        Client client = new Client();
        client.setFirstName(first);
        client.setLastName(last);
        client.setClientEmail(email);
        client.setClientPhone(phone);
        return clientRepository.save(client);
    }

    private Event persistEvent(Client client, String name) {
        Event event = new Event();
        event.setEventName(name);
        event.setEventStatus(EventStatus.CONFIRMED);
        event.setEventVenue("Nairobi");
        event.setEventLocation("Nairobi");
        event.setEventDateTime(OffsetDateTime.now().plusDays(30));
        event.setGuestCount(100);
        event.setClient(client);
        return eventRepository.save(event);
    }

    private Invoice persistInvoice(Event event, String number, BigDecimal amountDue) {
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(number);
        invoice.setEvent(event);
        invoice.setAmountDue(amountDue);
        invoice.setAmountPaid(BigDecimal.ZERO);
        invoice.setBalance(amountDue);
        invoice.setDueDate(event.getEventDateTime().toLocalDate());
        invoice.setInvoiceStatus(InvoiceStatus.UNPAID);
        invoice.setCreatedAt(OffsetDateTime.now());
        return invoiceRepository.save(invoice);
    }

    private void persistUser(String email, Role role, Client client) {
        AppUser user = new AppUser();
        user.setEmail(email);
        user.setPasswordHash("hash");
        user.setFullName(client.getFirstName() + " " + client.getLastName());
        user.setRole(role);
        user.setEnabled(true);
        user.setClient(client);
        appUserRepository.save(user);
    }

    private StkPushResponse stkResponse(String checkoutRequestId) {
        StkPushResponse response = new StkPushResponse();
        response.setCheckoutRequestId(checkoutRequestId);
        response.setMerchantRequestId("mr-" + checkoutRequestId);
        response.setResponseCode("0");
        response.setCustomerMessage("Success. Request accepted for processing");
        return response;
    }

    private StkPushQueryResponse stkQueryFailure(String resultDesc) {
        StkPushQueryResponse response = new StkPushQueryResponse();
        response.setResultCode("1032");
        response.setResultDesc(resultDesc);
        return response;
    }

    private StkCallbackPayload successCallback(String checkoutRequestId, String receipt) {
        StkCallbackPayload.CallbackItem receiptItem = new StkCallbackPayload.CallbackItem();
        receiptItem.setName("MpesaReceiptNumber");
        receiptItem.setValue(receipt);

        StkCallbackPayload.CallbackItem amountItem = new StkCallbackPayload.CallbackItem();
        amountItem.setName("Amount");
        amountItem.setValue(5000);

        StkCallbackPayload.CallbackMetadata metadata = new StkCallbackPayload.CallbackMetadata();
        metadata.setItem(List.of(receiptItem, amountItem));

        StkCallbackPayload.StkCallback callback = new StkCallbackPayload.StkCallback();
        callback.setCheckoutRequestId(checkoutRequestId);
        callback.setMerchantRequestId("mr-" + checkoutRequestId);
        callback.setResultCode(Integer.valueOf(0));
        callback.setResultDesc("The service request is processed successfully.");
        callback.setCallbackMetadata(metadata);

        StkCallbackPayload.CallbackBody body = new StkCallbackPayload.CallbackBody();
        body.setStkCallback(callback);

        StkCallbackPayload payload = new StkCallbackPayload();
        payload.setBody(body);
        return payload;
    }
}
