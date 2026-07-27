package com.dineevents.Invoice.Service;

import com.dineevents.Invoice.DTO.Response.InvoiceResponseDTO;
import com.dineevents.Invoice.Entity.Invoice;
import com.dineevents.Invoice.Enum.InvoiceStatus;
import com.dineevents.Invoice.Repository.InvoiceRepository;
import com.dineevents.Quotation.Entity.Quotation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {


    private final InvoiceRepository invoiceRepository;

    // Auto create a new invoice from Quotation
    public InvoiceResponseDTO createInvoiceFromQuotation(Quotation quotation){
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setQuotation(quotation);
        invoice.setEvent(quotation.getEvent());
        invoice.setAmountDue(quotation.getTotal()); // Price Snapshot
        invoice.setAmountPaid(BigDecimal.ZERO);
        invoice.setBalance(quotation.getTotal());
        invoice.setDueDate(quotation.getEvent().getEventDateTime().toLocalDate()); // Gotten from Quotation
        invoice.setInvoiceStatus(InvoiceStatus.UNPAID);
        invoice.setCreatedAt(quotation.getCreatedAt());
        Invoice savedInvoice = invoiceRepository.save(invoice);
        return toResponseDTO(savedInvoice);
    }


    // Generate Invoice Number
    private String generateInvoiceNumber() {
        return "INV-" + java.time.Year.now() + "-" + String.format("%04d", invoiceRepository.count() + 1);
    }

    //Mappers
    private InvoiceResponseDTO toResponseDTO(Invoice invoice){
        InvoiceResponseDTO dto = new InvoiceResponseDTO();
        dto.setInvoiceId(invoice.getInvoiceId());
        dto.setInvoiceNumber(invoice.getInvoiceNumber());
        dto.setEventName(invoice.getEvent().getEventName());

        // Get client name from Event
        if (invoice.getEvent().getClient() != null){
            dto.setClientName(invoice.getEvent().getClient().getFirstName() + " " + invoice.getEvent().getClient().getLastName());
        }
        dto.setAmountDue(invoice.getAmountDue());
        dto.setAmountPaid(invoice.getAmountPaid());
        dto.setBalance(invoice.getBalance());
        dto.setInvoiceStatus(invoice.getInvoiceStatus());
        dto.setDueDate(invoice.getDueDate());
        dto.setCreatedAt(invoice.getCreatedAt());
        return dto;
    }
}
