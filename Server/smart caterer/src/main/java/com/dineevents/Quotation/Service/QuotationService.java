package com.dineevents.Quotation.Service;

import com.dineevents.Inventory.Entity.InventoryItemAllocation;
import com.dineevents.Inventory.Enums.PricingType;
import com.dineevents.Inventory.Repository.InventoryAllocationRepository;
import com.dineevents.Invoice.DTO.Response.InvoiceResponseDTO;
import com.dineevents.Invoice.Service.InvoiceService;
import com.dineevents.Menu.Entity.EventMenuPackageSelection;
import com.dineevents.Menu.Entity.MenuPackageItem;
import com.dineevents.Menu.repository.EventMenuPackageSelectionRepository;
import com.dineevents.Menu.repository.MenuPackageItemRepository;
import com.dineevents.Quotation.DTO.QuotationLineItemResponseDTO;
import com.dineevents.Quotation.DTO.QuotationResponseDTO;
import com.dineevents.Quotation.DTO.Request.QuotationRequestDTO;
import com.dineevents.Quotation.Entity.Quotation;
import com.dineevents.Quotation.Entity.QuotationLineItem;
import com.dineevents.Quotation.Enum.LineItemType;
import com.dineevents.Quotation.Enum.QuotationStatus;
import com.dineevents.Quotation.Repository.QuotationRepository;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Enums.EventStatus;
import com.dineevents.event.Repository.EventRepository;
import com.dineevents.staff.Entity.StaffAssignment;
import com.dineevents.staff.Repository.StaffAssignmentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final InventoryAllocationRepository inventoryAllocationRepository;
    private final EventRepository eventRepository;
    private final StaffAssignmentRepository staffAssignmentRepository;
    private final InvoiceService invoiceService;
    private final EventMenuPackageSelectionRepository eventMenuPackageSelectionRepository;
    private final MenuPackageItemRepository menuPackageItemRepository;

    //Create a new quotation
    @org.springframework.transaction.annotation.Transactional
    public QuotationResponseDTO createQuotation(QuotationRequestDTO dto){
        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + dto.getEventId()));

        if (event.getEventStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Cannot create a quotation for a cancelled event");
        }

        Quotation quotation = new Quotation();
        quotation.setQuotationNumber(generateQuotationNumber());
        quotation.setEvent(event);

        // Optional to set valid until if the admin provides one or the system auto generates
        OffsetDateTime now = OffsetDateTime.now();
        quotation.setCreatedAt(now);
        LocalDate validUntil = dto.getValidUntil() != null
                ? dto.getValidUntil()
                : calculateValidUntil(event,now );
        quotation.setValidUntil(validUntil);

        // Set the quotation name
        String name = dto.getQuotationName() != null && !dto.getQuotationName().isBlank()
                ? dto.getQuotationName()
                : event.getEventName() + " Quotation";
        quotation.setQuotationName(name);

        quotation.setQuotationStatus(QuotationStatus.DRAFT);
        quotation.setCreatedAt(OffsetDateTime.now());

        List<QuotationLineItem> lineItems = new ArrayList<>();

        // Menu package line items — one row per package selected for this event
        List<EventMenuPackageSelection> menuSelections = eventMenuPackageSelectionRepository.findByEvent(event);
        for (EventMenuPackageSelection selection : menuSelections) {
            int guestCount = selection.getGuestCountOverride() != null
                    ? selection.getGuestCountOverride()
                    : event.getGuestCount();

            QuotationLineItem menuLine = new QuotationLineItem();
            menuLine.setQuotation(quotation);
            menuLine.setLineItemType(LineItemType.MENU_PACKAGE);
            menuLine.setMenuPackage(selection.getMenuPackage());
            menuLine.setDescription(selection.getMenuPackage().getPackageName());
            menuLine.setQuantity(BigDecimal.valueOf(guestCount));
            menuLine.setUnitPriceAtQuotation(selection.getMenuPackage().getPricePerPax());
            menuLine.setLineTotal(
                    selection.getMenuPackage().getPricePerPax().multiply(BigDecimal.valueOf(guestCount))
            );
            lineItems.add(menuLine);
        }

        // Inventory line items
        List<InventoryItemAllocation> allocations =  inventoryAllocationRepository.findByEvent(event);

        for (InventoryItemAllocation allocation : allocations){
            QuotationLineItem lineItem = new QuotationLineItem();
            lineItem.setQuotation(quotation);
            lineItem.setLineItemType(LineItemType.RENTAL);
            lineItem.setInventoryItemAllocation(allocation);
            lineItem.setDescription(allocation.getInventory().getInventoryName());
            if (allocation.getPricingType() == PricingType.PER_UNIT) {
                lineItem.setQuantity(BigDecimal.valueOf(allocation.getQuantityAllocated()));
                lineItem.setUnitPriceAtQuotation(allocation.getUnitPrice());
            } else { // FLAT_RATE
                lineItem.setQuantity(BigDecimal.ONE);
                lineItem.setUnitPriceAtQuotation(allocation.getFlatRate());
            }
            lineItem.setLineTotal(allocation.getTotalCost());
            lineItems.add(lineItem);
        }

        // Staff line items
        List<StaffAssignment> staffAssignments = staffAssignmentRepository.findByEvent(event);
        for (StaffAssignment staffAssignment : staffAssignments){
            QuotationLineItem lineItem = new QuotationLineItem();
            lineItem.setQuotation(quotation);
            lineItem.setLineItemType(LineItemType.STAFF);
            lineItem.setAssignedStaff(staffAssignment);
            lineItem.setDescription(staffAssignment.getStaff().getStaffName());
            lineItem.setQuantity(BigDecimal.ONE);
            lineItem.setUnitPriceAtQuotation(staffAssignment.getSalaryAtAssignment());
            lineItem.setLineTotal(staffAssignment.getSalaryAtAssignment());
            lineItems.add(lineItem);
        }

        quotation.setLineItems(lineItems);

        BigDecimal subtotal = lineItems.stream()
                .map(QuotationLineItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        quotation.setSubTotal(subtotal);

        BigDecimal discountPct = event.getDiscountPercent() == null
                ? BigDecimal.ZERO
                : event.getDiscountPercent();
        if (discountPct.compareTo(BigDecimal.ZERO) < 0) {
            discountPct = BigDecimal.ZERO;
        }
        if (discountPct.compareTo(new BigDecimal("100")) > 0) {
            discountPct = new BigDecimal("100");
        }
        BigDecimal discountAmount = subtotal
                .multiply(discountPct)
                .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        quotation.setDiscountPercent(discountPct);
        quotation.setDiscountAmount(discountAmount);
        quotation.setDiscountReason(event.getDiscountReason());
        quotation.setTotal(subtotal.subtract(discountAmount).max(BigDecimal.ZERO));

        Quotation savedQuotation = quotationRepository.save(quotation);
        supersedePreviousQuotations(event.getEventId(), savedQuotation.getQuotationId());
        // Revised proposal replaces open unpaid invoices from earlier accepted quotes.
        invoiceService.cancelOpenInvoicesForEvent(event.getEventId(), null);
        log.info("Created draft quotation {} for event {}", savedQuotation.getQuotationId(), event.getEventId());
        return toResponseDTO(savedQuotation);
    }

    @org.springframework.transaction.annotation.Transactional
    public QuotationResponseDTO sendQuotation(Long quotationId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + quotationId));

        if (quotation.getQuotationStatus() != QuotationStatus.DRAFT) {
            throw new IllegalStateException(
                    "Only draft quotations can be sent (current status: " + quotation.getQuotationStatus() + ")");
        }

        Long eventId = quotation.getEvent().getEventId();
        supersedePreviousQuotations(eventId, quotationId);
        invoiceService.cancelOpenInvoicesForEvent(eventId, null);

        quotation.setQuotationStatus(QuotationStatus.SENT);
        Quotation saved = quotationRepository.save(quotation);
        log.info("Quotation {} sent to client for event {}", quotationId, eventId);
        return toResponseDTO(saved);
    }

    /**
     * Client-portal acceptance: only SENT quotations can be accepted by the client.
     * Admin override still uses {@link #approveQuotation(Long)}.
     */
    public InvoiceResponseDTO acceptSentQuotation(Long quotationId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + quotationId));

        if (quotation.getQuotationStatus() != QuotationStatus.SENT) {
            throw new IllegalStateException(
                    quotation.getQuotationStatus() == QuotationStatus.SUPERSEDED
                            ? "This quotation was replaced by a revised proposal. Please review the latest quotation."
                            : "Only sent quotations can be accepted by the client (current status: "
                                    + quotation.getQuotationStatus() + ")");
        }

        return approveQuotation(quotationId);
    }

    // Get all quotations
    public List<QuotationResponseDTO> getAllQuotations(){
        log.info("Retrieving all quotations");
        List<Quotation> quotations = quotationRepository.findAll();
        return quotations.stream().map(this::toResponseDTO).toList();
    }

    public List<QuotationResponseDTO> getQuotationsByEventId(Long eventId) {
        return quotationRepository.findByEvent_EventId(eventId).stream().map(this::toResponseDTO).toList();
    }

    public QuotationResponseDTO getQuotationById(Long quotationId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + quotationId));
        return toResponseDTO(quotation);
    }

    public QuotationResponseDTO declineQuotation(Long quotationId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + quotationId));
        if (quotation.getQuotationStatus() != QuotationStatus.DRAFT
                && quotation.getQuotationStatus() != QuotationStatus.SENT) {
            throw new IllegalStateException(
                    "Cannot decline quotation in status " + quotation.getQuotationStatus());
        }
        quotation.setQuotationStatus(QuotationStatus.REJECTED);
        return toResponseDTO(quotationRepository.save(quotation));
    }

    // Approve Quotation
    @org.springframework.transaction.annotation.Transactional
    public InvoiceResponseDTO approveQuotation(Long quotationId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + quotationId));

        if (quotation.getQuotationStatus() != QuotationStatus.DRAFT
                && quotation.getQuotationStatus() != QuotationStatus.SENT) {
            throw new IllegalStateException(
                    "Cannot approve quotation in status " + quotation.getQuotationStatus());
        }

        Long eventId = quotation.getEvent().getEventId();
        supersedePreviousQuotations(eventId, quotationId);

        quotation.setQuotationStatus(QuotationStatus.ACCEPTED);
        quotationRepository.save(quotation);

        return invoiceService.createInvoiceFromQuotation(quotation);
    }

    /**
     * Marks earlier open / accepted-but-revisable proposals as SUPERSEDED so the client
     * can only act on the current revision.
     */
    private void supersedePreviousQuotations(Long eventId, Long keepQuotationId) {
        List<QuotationStatus> openStatuses = List.of(
                QuotationStatus.DRAFT,
                QuotationStatus.SENT,
                QuotationStatus.ACCEPTED,
                QuotationStatus.EXPIRED
        );
        List<Quotation> toSupersede = new ArrayList<>();
        for (Quotation quotation : quotationRepository.findByEvent_EventIdAndQuotationStatusIn(eventId, openStatuses)) {
            if (quotation.getQuotationId().equals(keepQuotationId)) {
                continue;
            }
            // Keep ACCEPTED history when the linked invoice already has payments.
            if (quotation.getQuotationStatus() == QuotationStatus.ACCEPTED
                    && invoiceService.hasPaidOrPartialInvoiceForQuotation(quotation.getQuotationId())) {
                continue;
            }
            quotation.setQuotationStatus(QuotationStatus.SUPERSEDED);
            toSupersede.add(quotation);
        }
        if (!toSupersede.isEmpty()) {
            quotationRepository.saveAll(toSupersede);
            log.info("Superseded {} older quotation(s) for event {} in favour of {}",
                    toSupersede.size(), eventId, keepQuotationId);
        }
    }

    // Helper Methods
    private String generateQuotationNumber() {
        return "QT-" + java.time.Year.now() + "-" + String.format("%04d", quotationRepository.count() + 1);
    }

    //Business Rule quotation is only valid for 14 days with
    //and only two days before the event
    private LocalDate calculateValidUntil(Event event, OffsetDateTime createdAt){
        LocalDate today = createdAt.toLocalDate();
        LocalDate eventDate = event.getEventDateTime().toLocalDate();

        LocalDate standardValidity = today.plusDays(14);
        LocalDate latestAllowed = eventDate.minusDays(2);

        LocalDate validUntil = standardValidity.isBefore(latestAllowed) ? standardValidity : latestAllowed;

        // Short Notice Events fall back to one day before or today if that's gone too
        if (!validUntil.isAfter(today)){
            LocalDate dayBeforeEvent = eventDate.minusDays(1);
            validUntil = dayBeforeEvent.isAfter(today) ? dayBeforeEvent : today;
        }
        return validUntil;
    }

    //To Respsonse DTO
    public QuotationResponseDTO toResponseDTO(Quotation quotation){
        QuotationResponseDTO dto = new QuotationResponseDTO();
        dto.setQuotationId(quotation.getQuotationId());
        dto.setQuotationNumber(quotation.getQuotationNumber());
        dto.setEventId(quotation.getEvent().getEventId());
        dto.setEventName(quotation.getEvent().getEventName());
        if (quotation.getEvent().getClient() != null){
            dto.setClientName(quotation.getEvent().getClient().getFirstName() + " " + quotation.getEvent().getClient().getLastName());
            dto.setClientEmail(quotation.getEvent().getClient().getClientEmail());
            dto.setClientPhone(quotation.getEvent().getClient().getClientPhone());
        }
        dto.setSubTotal(quotation.getSubTotal());
        dto.setDiscountPercent(quotation.getDiscountPercent() == null ? BigDecimal.ZERO : quotation.getDiscountPercent());
        dto.setDiscountAmount(quotation.getDiscountAmount() == null ? BigDecimal.ZERO : quotation.getDiscountAmount());
        dto.setDiscountReason(quotation.getDiscountReason());
        dto.setQuotationName(quotation.getQuotationName());
        dto.setTotal(quotation.getTotal());
        dto.setQuotationStatus(quotation.getQuotationStatus());
        dto.setValidUntil(quotation.getValidUntil());
        dto.setCreatedAt(quotation.getCreatedAt());
        // add get line Items
        dto.setLineItems(quotation.getLineItems().stream().map(this::toLineDTO).toList());
        return dto;
    }

    private QuotationLineItemResponseDTO toLineDTO(QuotationLineItem lineItem){
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