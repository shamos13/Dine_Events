package com.dineevents.Quotation.Service;

import com.dineevents.Inventory.Entity.InventoryItemAllocation;
import com.dineevents.Inventory.Enums.PricingType;
import com.dineevents.Inventory.Repository.InventoryAllocationRepository;
import com.dineevents.Quotation.DTO.QuotationLineItemResponseDTO;
import com.dineevents.Quotation.DTO.QuotationResponseDTO;
import com.dineevents.Quotation.DTO.Request.QuotationRequestDTO;
import com.dineevents.Quotation.Entity.Quotation;
import com.dineevents.Quotation.Entity.QuotationLineItem;
import com.dineevents.Quotation.Enum.LineItemType;
import com.dineevents.Quotation.Enum.QuotationStatus;
import com.dineevents.Quotation.Repository.QuotationRepository;
import com.dineevents.event.Entity.Event;
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

    //Create a new quotation
    public QuotationResponseDTO createQuotation(QuotationRequestDTO dto){
        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + dto.getEventId()));

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
        quotation.setTotal(subtotal);

        Quotation savedQuotation = quotationRepository.save(quotation);
        return toResponseDTO(savedQuotation);

    }

    // Get all quotations
    public List<QuotationResponseDTO> getAllQuotations(){
        log.info("Retrieving all quotations");
        List<Quotation> quotations = quotationRepository.findAll();
        return quotations.stream().map(this::toResponseDTO).toList();
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
    private QuotationResponseDTO toResponseDTO(Quotation quotation){
        QuotationResponseDTO dto = new QuotationResponseDTO();
        dto.setQuotationId(quotation.getQuotationId());
        dto.setQuotationNumber(quotation.getQuotationNumber());
        dto.setEventName(quotation.getEvent().getEventName());
        if (quotation.getEvent().getClient() != null){
            dto.setClientName(quotation.getEvent().getClient().getFirstName() + " " + quotation.getEvent().getClient().getLastName());
            dto.setClientEmail(quotation.getEvent().getClient().getClientEmail());
            dto.setClientPhone(quotation.getEvent().getClient().getClientPhone());
        }
        dto.setSubTotal(quotation.getSubTotal());
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
        return dto;
    }

}
