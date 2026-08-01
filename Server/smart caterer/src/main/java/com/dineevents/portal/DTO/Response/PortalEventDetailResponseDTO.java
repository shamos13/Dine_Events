package com.dineevents.portal.DTO.Response;

import com.dineevents.Inventory.DTO.Response.InventoryAllocationResponse;
import com.dineevents.Invoice.DTO.Response.InvoiceResponseDTO;
import com.dineevents.Menu.DTO.Response.EventMenuPackageSelectionResponseDTO;
import com.dineevents.Quotation.DTO.QuotationResponseDTO;
import com.dineevents.event.DTO.Response.EventResponseDTO;
import lombok.Data;

import java.util.List;

@Data
public class PortalEventDetailResponseDTO {
    private EventResponseDTO event;
    private List<EventMenuPackageSelectionResponseDTO> menuSelections;
    private List<InventoryAllocationResponse> rentals;
    private List<QuotationResponseDTO> quotations;
    private List<InvoiceResponseDTO> invoices;
}
