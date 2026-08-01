package com.dineevents.portal.Controller;

import com.dineevents.Invoice.DTO.Response.InvoiceResponseDTO;
import com.dineevents.Menu.DTO.Response.MenuCategoryResponseDto;
import com.dineevents.Menu.DTO.Response.MenuPackageResponseDTO;
import com.dineevents.Quotation.DTO.QuotationResponseDTO;
import com.dineevents.event.DTO.Response.EventResponseDTO;
import com.dineevents.feedback.DTO.Request.FeedbackRequestDTO;
import com.dineevents.feedback.DTO.Response.FeedbackResponseDTO;
import com.dineevents.feedback.Service.FeedbackService;
import com.dineevents.Payment.DTO.Request.PaymentReceiptConfirmRequestDTO;
import com.dineevents.Payment.DTO.Response.PaymentResponseDTO;
import com.dineevents.Payment.DTO.Response.PaymentStatusResponseDTO;
import com.dineevents.portal.DTO.Request.PortalEventCreateRequest;
import com.dineevents.portal.DTO.Request.PortalEventUpdateRequest;
import com.dineevents.portal.DTO.Request.PortalPayRequest;
import com.dineevents.portal.DTO.Request.PortalProfileUpdateRequest;
import com.dineevents.portal.DTO.Response.PortalCancellationResponseDTO;
import com.dineevents.portal.DTO.Response.PortalDashboardResponseDTO;
import com.dineevents.portal.DTO.Response.PortalEventDetailResponseDTO;
import com.dineevents.portal.DTO.Response.PortalProfileResponseDTO;
import com.dineevents.portal.Service.PortalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/portal")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENT')")
public class PortalController {

    private final PortalService portalService;
    private final FeedbackService feedbackService;

    @GetMapping("/me")
    public ResponseEntity<PortalProfileResponseDTO> getProfile() {
        return ResponseEntity.ok(portalService.getProfile());
    }

    @PutMapping("/me")
    public ResponseEntity<PortalProfileResponseDTO> updateProfile(@Valid @RequestBody PortalProfileUpdateRequest request) {
        return ResponseEntity.ok(portalService.updateProfile(request));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<PortalDashboardResponseDTO> getDashboard() {
        return ResponseEntity.ok(portalService.getDashboard());
    }

    @GetMapping("/events")
    public ResponseEntity<List<EventResponseDTO>> getEvents() {
        return ResponseEntity.ok(portalService.getMyEvents());
    }

    @GetMapping("/events/{eventId}")
    public ResponseEntity<PortalEventDetailResponseDTO> getEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(portalService.getMyEventDetail(eventId));
    }

    @PostMapping("/events")
    public ResponseEntity<PortalEventDetailResponseDTO> createEvent(@Valid @RequestBody PortalEventCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(portalService.createInquiry(request));
    }

    @PatchMapping("/events/{eventId}")
    public ResponseEntity<PortalEventDetailResponseDTO> updateEvent(
            @PathVariable Long eventId,
            @Valid @RequestBody PortalEventUpdateRequest request
    ) {
        return ResponseEntity.ok(portalService.updateMyEvent(eventId, request));
    }

    @PostMapping("/events/{eventId}/cancel")
    public ResponseEntity<PortalCancellationResponseDTO> cancelEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(portalService.cancelMyEvent(eventId));
    }

    @GetMapping("/quotations")
    public ResponseEntity<List<QuotationResponseDTO>> getQuotations() {
        return ResponseEntity.ok(portalService.getMyQuotations());
    }

    @GetMapping("/quotations/{quotationId}")
    public ResponseEntity<QuotationResponseDTO> getQuotation(@PathVariable Long quotationId) {
        return ResponseEntity.ok(portalService.getMyQuotation(quotationId));
    }

    @PatchMapping("/quotations/{quotationId}/accept")
    public ResponseEntity<InvoiceResponseDTO> acceptQuotation(@PathVariable Long quotationId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(portalService.acceptQuotation(quotationId));
    }

    @PatchMapping("/quotations/{quotationId}/decline")
    public ResponseEntity<QuotationResponseDTO> declineQuotation(@PathVariable Long quotationId) {
        return ResponseEntity.ok(portalService.declineQuotation(quotationId));
    }

    @GetMapping("/invoices")
    public ResponseEntity<List<InvoiceResponseDTO>> getInvoices() {
        return ResponseEntity.ok(portalService.getMyInvoices());
    }

    @GetMapping("/invoices/{invoiceId}")
    public ResponseEntity<InvoiceResponseDTO> getInvoice(@PathVariable Long invoiceId) {
        return ResponseEntity.ok(portalService.getMyInvoice(invoiceId));
    }

    @PostMapping("/invoices/{invoiceId}/pay")
    public ResponseEntity<PaymentResponseDTO> payInvoice(
            @PathVariable Long invoiceId,
            @Valid @RequestBody PortalPayRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(portalService.payInvoice(invoiceId, request));
    }

    @GetMapping("/payments/{paymentId}/status")
    public ResponseEntity<PaymentStatusResponseDTO> getPaymentStatus(@PathVariable Long paymentId) {
        return ResponseEntity.ok(portalService.getPaymentStatus(paymentId));
    }

    @PostMapping("/payments/{paymentId}/receipt")
    public ResponseEntity<PaymentStatusResponseDTO> confirmPaymentReceipt(
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentReceiptConfirmRequestDTO request
    ) {
        return ResponseEntity.ok(portalService.confirmPaymentReceipt(paymentId, request.getMpesaReceiptNumber()));
    }

    @GetMapping("/menu/packages")
    public ResponseEntity<List<MenuPackageResponseDTO>> getMenuPackages() {
        return ResponseEntity.ok(portalService.getMenuPackages());
    }

    @GetMapping("/menu/categories")
    public ResponseEntity<List<MenuCategoryResponseDto>> getMenuCategories() {
        return ResponseEntity.ok(portalService.getMenuCategories());
    }

    @PostMapping("/feedback")
    public ResponseEntity<FeedbackResponseDTO> submitFeedback(@Valid @RequestBody FeedbackRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(feedbackService.submitFeedback(request));
    }

    @GetMapping("/feedback")
    public ResponseEntity<List<FeedbackResponseDTO>> getMyFeedback() {
        return ResponseEntity.ok(feedbackService.getMyFeedback());
    }
}
