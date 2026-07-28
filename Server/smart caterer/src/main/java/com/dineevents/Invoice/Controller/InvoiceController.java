package com.dineevents.Invoice.Controller;

import com.dineevents.Invoice.DTO.Response.InvoiceResponseDTO;
import com.dineevents.Invoice.Service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/invoice")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping("/all-invoices")
    public ResponseEntity<List<InvoiceResponseDTO>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    @GetMapping("/{invoiceId}")
    public ResponseEntity<InvoiceResponseDTO> getInvoiceById(@PathVariable Long invoiceId) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(invoiceId));
    }
}
