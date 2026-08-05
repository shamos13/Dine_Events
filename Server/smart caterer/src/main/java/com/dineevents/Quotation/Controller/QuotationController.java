package com.dineevents.Quotation.Controller;

import com.dineevents.Invoice.DTO.Response.InvoiceResponseDTO;
import com.dineevents.Quotation.DTO.QuotationResponseDTO;
import com.dineevents.Quotation.DTO.Request.QuotationRequestDTO;
import com.dineevents.Quotation.Service.QuotationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/quotation")
public class QuotationController {

    private final QuotationService quotationService;

    @PostMapping("/generate")
    public ResponseEntity<QuotationResponseDTO> createQuotation(@Valid @RequestBody QuotationRequestDTO quotationRequestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quotationService.createQuotation(quotationRequestDTO));
    }

    @GetMapping("/all-quotations")
    public ResponseEntity<List<QuotationResponseDTO>> getAllQuotations() {
        return ResponseEntity.status(HttpStatus.OK).body(quotationService.getAllQuotations());
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<QuotationResponseDTO>> getQuotationsByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(quotationService.getQuotationsByEventId(eventId));
    }

    @PatchMapping("/{quotationId}/send")
    public ResponseEntity<QuotationResponseDTO> sendQuotation(@PathVariable Long quotationId) {
        return ResponseEntity.ok(quotationService.sendQuotation(quotationId));
    }

    @PatchMapping("/{quotationId}/approve")
    public ResponseEntity<InvoiceResponseDTO> approveQuotation(@PathVariable Long quotationId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quotationService.approveQuotation(quotationId));
    }
}
