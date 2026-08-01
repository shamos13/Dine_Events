package com.dineevents.Invoice.Service;

import com.dineevents.Invoice.DTO.Response.InvoiceResponseDTO;
import com.dineevents.Invoice.Entity.Invoice;
import com.dineevents.Invoice.Enum.InvoiceStatus;
import com.dineevents.Invoice.Repository.InvoiceRepository;
import com.dineevents.Menu.Entity.MenuPackageItem;
import com.dineevents.Menu.repository.MenuPackageItemRepository;
import com.dineevents.Payment.Entity.Payment;
import com.dineevents.Payment.Repository.PaymentRepository;
import com.dineevents.Payment.Service.PaymentService;
import com.dineevents.Quotation.DTO.QuotationLineItemResponseDTO;
import com.dineevents.Quotation.Entity.Quotation;
import com.dineevents.Quotation.Entity.QuotationLineItem;
import com.dineevents.Quotation.Enum.LineItemType;
import com.dineevents.event.Service.EventService;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final MenuPackageItemRepository menuPackageItemRepository;
    private final PaymentService paymentService;
    private final EventService eventService;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            MenuPackageItemRepository menuPackageItemRepository,
            @Lazy PaymentService paymentService,
            @Lazy EventService eventService
    ) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.menuPackageItemRepository = menuPackageItemRepository;
        this.paymentService = paymentService;
        this.eventService = eventService;
    }

    public InvoiceResponseDTO createInvoiceFromQuotation(Quotation quotation) {
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setQuotation(quotation);
        invoice.setEvent(quotation.getEvent());
        invoice.setAmountDue(quotation.getTotal());
        invoice.setAmountPaid(BigDecimal.ZERO);
        invoice.setBalance(quotation.getTotal());
        invoice.setDueDate(quotation.getEvent().getEventDateTime().toLocalDate());
        invoice.setInvoiceStatus(InvoiceStatus.UNPAID);
        invoice.setCreatedAt(quotation.getCreatedAt());
        Invoice savedInvoice = invoiceRepository.save(invoice);
        return toResponseDTO(savedInvoice);
    }

    /**
     * Atomically credit a payment against an invoice under a pessimistic write lock
     * so concurrent completions (manual + STK callback) cannot corrupt the balance.
     */
    @Transactional
    public void applyPayment(Long invoiceId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }

        Invoice invoice = invoiceRepository.findByIdForUpdate(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + invoiceId));

        BigDecimal balance = invoice.getBalance() != null ? invoice.getBalance() : BigDecimal.ZERO;
        if (amount.compareTo(balance) > 0) {
            throw new IllegalArgumentException(
                    "Payment amount " + amount + " exceeds invoice balance of " + balance);
        }

        BigDecimal amountPaid = invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal newPaid = amountPaid.add(amount);
        BigDecimal newBalance = balance.subtract(amount);

        invoice.setAmountPaid(newPaid);
        invoice.setBalance(newBalance);

        if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setInvoiceStatus(InvoiceStatus.PAID);
        } else {
            invoice.setInvoiceStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        invoiceRepository.save(invoice);
        log.info("Applied payment of {} to invoice {} — paid={}, balance={}, status={}",
                amount, invoiceId, newPaid, newBalance, invoice.getInvoiceStatus());

        if (invoice.getInvoiceStatus() == InvoiceStatus.PAID && invoice.getEvent() != null) {
            eventService.confirmEventFromPayment(invoice.getEvent().getEventId());
        }
    }

    public List<InvoiceResponseDTO> getAllInvoices() {
        return invoiceRepository.findAll().stream().map(this::toResponseDTO).toList();
    }

    public InvoiceResponseDTO getInvoiceById(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + invoiceId));
        return toResponseDTO(invoice);
    }

    public List<InvoiceResponseDTO> getInvoicesByEventId(Long eventId) {
        return invoiceRepository.findByEvent_EventId(eventId).stream().map(this::toResponseDTO).toList();
    }

    private String generateInvoiceNumber() {
        return "INV-" + java.time.Year.now() + "-" + String.format("%04d", invoiceRepository.count() + 1);
    }

    public InvoiceResponseDTO toResponseDTO(Invoice invoice) {
        InvoiceResponseDTO dto = new InvoiceResponseDTO();
        dto.setInvoiceId(invoice.getInvoiceId());
        dto.setInvoiceNumber(invoice.getInvoiceNumber());
        dto.setEventId(invoice.getEvent().getEventId());
        dto.setEventName(invoice.getEvent().getEventName());

        if (invoice.getEvent().getClient() != null) {
            dto.setClientName(invoice.getEvent().getClient().getFirstName() + " "
                    + invoice.getEvent().getClient().getLastName());
            dto.setClientPhone(invoice.getEvent().getClient().getClientPhone());
        }
        if (invoice.getQuotation() != null) {
            dto.setQuotationId(invoice.getQuotation().getQuotationId());
            if (invoice.getQuotation().getLineItems() != null) {
                dto.setLineItems(invoice.getQuotation().getLineItems().stream().map(this::toLineDTO).toList());
            } else {
                dto.setLineItems(Collections.emptyList());
            }
        }
        dto.setAmountDue(invoice.getAmountDue());
        dto.setAmountPaid(invoice.getAmountPaid());
        dto.setBalance(invoice.getBalance());
        dto.setInvoiceStatus(invoice.getInvoiceStatus());
        dto.setDueDate(invoice.getDueDate());
        dto.setCreatedAt(invoice.getCreatedAt());

        List<Payment> payments = paymentRepository.findByInvoice_InvoiceIdOrderByInitiatedAtDesc(invoice.getInvoiceId());
        dto.setPayments(payments.stream().map(paymentService::toResponseDTO).toList());
        return dto;
    }

    private QuotationLineItemResponseDTO toLineDTO(QuotationLineItem lineItem) {
        QuotationLineItemResponseDTO dto = new QuotationLineItemResponseDTO();
        dto.setLineItemId(lineItem.getLineItemId());
        dto.setLineItemDescription(lineItem.getDescription());
        dto.setLineItemType(lineItem.getLineItemType());
        dto.setQuantity(lineItem.getQuantity());
        dto.setUnitPriceAtQuotation(lineItem.getUnitPriceAtQuotation());
        dto.setTotalPrice(lineItem.getLineTotal());

        if (lineItem.getLineItemType() == LineItemType.MENU_PACKAGE && lineItem.getMenuPackage() != null) {
            List<MenuPackageItem> packageItems = menuPackageItemRepository
                    .findByMenuPackage_MenuPackageId(lineItem.getMenuPackage().getMenuPackageId());
            dto.setIncludedMenuItemNames(
                    packageItems.stream().map(pi -> pi.getMenuItem().getMenuItemName()).toList()
            );
        }
        return dto;
    }
}
