package com.dineevents.portal.Service;

import com.dineevents.Inventory.Service.InventoryAllocationService;
import com.dineevents.Invoice.DTO.Response.InvoiceResponseDTO;
import com.dineevents.Invoice.Entity.Invoice;
import com.dineevents.Invoice.Enum.InvoiceStatus;
import com.dineevents.Invoice.Repository.InvoiceRepository;
import com.dineevents.Invoice.Service.InvoiceService;
import com.dineevents.Menu.DTO.Request.EventMenuPackageSelectionRequestDTO;
import com.dineevents.Menu.DTO.Response.MenuCategoryResponseDto;
import com.dineevents.Menu.DTO.Response.MenuPackageResponseDTO;
import com.dineevents.Menu.service.EventMenuPackageSelectionService;
import com.dineevents.Menu.service.MenuCategoryService;
import com.dineevents.Menu.service.MenuPackageService;
import com.dineevents.Quotation.DTO.QuotationResponseDTO;
import com.dineevents.Quotation.Entity.Quotation;
import com.dineevents.Quotation.Repository.QuotationRepository;
import com.dineevents.Quotation.Service.QuotationService;
import com.dineevents.auth.DTO.Response.AuthResponseDTO;
import com.dineevents.auth.Entity.AppUser;
import com.dineevents.auth.Repository.AppUserRepository;
import com.dineevents.auth.Service.AuthService;
import com.dineevents.client.Entity.Client;
import com.dineevents.client.Repository.ClientRepository;
import com.dineevents.common.CurrentUserService;
import com.dineevents.event.DTO.Response.EventResponseDTO;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Enums.EventStatus;
import com.dineevents.event.Repository.EventRepository;
import com.dineevents.event.Service.EventConflictService;
import com.dineevents.event.Service.EventService;
import com.dineevents.Payment.DTO.Response.PaymentResponseDTO;
import com.dineevents.Payment.DTO.Response.PaymentStatusResponseDTO;
import com.dineevents.Payment.Entity.Payment;
import com.dineevents.Payment.Repository.PaymentRepository;
import com.dineevents.Payment.Service.PaymentService;
import com.dineevents.Menu.DTO.Response.EventMenuPackageSelectionResponseDTO;
import com.dineevents.portal.DTO.Request.PortalEventCreateRequest;
import com.dineevents.portal.DTO.Request.PortalEventUpdateRequest;
import com.dineevents.portal.DTO.Request.PortalPasswordChangeRequest;
import com.dineevents.portal.DTO.Request.PortalPayRequest;
import com.dineevents.portal.DTO.Request.PortalProfileUpdateRequest;
import com.dineevents.portal.DTO.Response.PortalActivityItemDTO;
import com.dineevents.portal.DTO.Response.PortalCancellationResponseDTO;
import com.dineevents.portal.DTO.Response.PortalDashboardResponseDTO;
import com.dineevents.portal.DTO.Response.PortalEventDetailResponseDTO;
import com.dineevents.portal.DTO.Response.PortalProfileResponseDTO;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PortalService {

    private final CurrentUserService currentUserService;
    private final ClientRepository clientRepository;
    private final AppUserRepository appUserRepository;
    private final AuthService authService;
    private final EventRepository eventRepository;
    private final EventService eventService;
    private final EventConflictService eventConflictService;
    private final EventMenuPackageSelectionService selectionService;
    private final InventoryAllocationService inventoryAllocationService;
    private final QuotationRepository quotationRepository;
    private final QuotationService quotationService;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final MenuPackageService menuPackageService;
    private final MenuCategoryService menuCategoryService;

    public PortalProfileResponseDTO getProfile() {
        return toProfile(currentUserService.requireCurrentClient());
    }

    @Transactional
    public PortalProfileResponseDTO updateProfile(PortalProfileUpdateRequest request) {
        Client client = currentUserService.requireCurrentClient();
        AppUser user = currentUserService.requireCurrentUser();

        String email = request.getClientEmail().trim();
        boolean emailChanged = !email.equalsIgnoreCase(user.getEmail())
                || !email.equalsIgnoreCase(client.getClientEmail());

        if (emailChanged) {
            appUserRepository.findByEmailIgnoreCase(email).ifPresent(other -> {
                if (!other.getUserId().equals(user.getUserId())) {
                    throw new IllegalArgumentException("Email already registered: " + email);
                }
            });
            boolean clientEmailTaken = clientRepository.findByClientEmailIgnoreCase(email).stream()
                    .anyMatch(other -> !other.getClientId().equals(client.getClientId()));
            if (clientEmailTaken) {
                throw new IllegalArgumentException("Email already registered: " + email);
            }
            client.setClientEmail(email);
            user.setEmail(email);
        }

        client.setFirstName(request.getFirstName().trim());
        client.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
        client.setClientPhone(request.getClientPhone().trim());
        client.setCompanyName(
                request.getCompanyName() != null && !request.getCompanyName().isBlank()
                        ? request.getCompanyName().trim()
                        : null
        );
        client.setProfileImageUrl(
                request.getProfileImageUrl() != null && !request.getProfileImageUrl().isBlank()
                        ? request.getProfileImageUrl().trim()
                        : null
        );
        Client saved = clientRepository.save(client);

        user.setFullName((saved.getFirstName() + " " + (saved.getLastName() == null ? "" : saved.getLastName())).trim());
        appUserRepository.save(user);

        PortalProfileResponseDTO response = toProfile(saved);
        if (emailChanged) {
            AuthResponseDTO tokens = authService.reissueTokens(user);
            response.setToken(tokens.getToken());
            response.setRefreshToken(tokens.getRefreshToken());
        }
        return response;
    }

    @Transactional
    public void changePassword(PortalPasswordChangeRequest request) {
        AppUser user = currentUserService.requireCurrentUser();
        authService.changePassword(user, request.getCurrentPassword(), request.getNewPassword());
    }

    public PortalDashboardResponseDTO getDashboard() {
        Client client = currentUserService.requireCurrentClient();
        Long clientId = client.getClientId();

        List<Event> events = eventRepository.findByClient_ClientIdOrderByEventDateTimeAsc(clientId);
        OffsetDateTime now = OffsetDateTime.now();
        Event next = events.stream()
                .filter(e -> e.getEventDateTime() != null && !e.getEventDateTime().isBefore(now))
                .filter(e -> e.getEventStatus() != EventStatus.CANCELLED)
                .findFirst()
                .orElse(null);

        List<Invoice> invoices = invoiceRepository.findByEvent_Client_ClientIdOrderByCreatedAtDesc(clientId);
        BigDecimal totalBudget = invoices.stream()
                .map(i -> i.getAmountDue() != null ? i.getAmountDue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPaid = invoices.stream()
                .map(i -> i.getAmountPaid() != null ? i.getAmountPaid() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalOutstanding = invoices.stream()
                .filter(i -> i.getInvoiceStatus() != InvoiceStatus.CANCELLED)
                .map(i -> i.getBalance() != null ? i.getBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long pending = invoices.stream()
                .filter(i -> i.getInvoiceStatus() == InvoiceStatus.UNPAID
                        || i.getInvoiceStatus() == InvoiceStatus.PARTIALLY_PAID
                        || i.getInvoiceStatus() == InvoiceStatus.OVERDUE)
                .count();

        PortalDashboardResponseDTO dto = new PortalDashboardResponseDTO();
        dto.setClientName((client.getFirstName() + " " + (client.getLastName() == null ? "" : client.getLastName())).trim());
        dto.setNextEvent(next != null ? eventService.toResponseDTO(next) : null);
        dto.setTotalBudget(totalBudget);
        dto.setTotalPaid(totalPaid);
        dto.setTotalOutstanding(totalOutstanding);
        dto.setPendingInvoiceCount(pending);
        dto.setActivity(synthesizeActivity(clientId, events, invoices));
        return dto;
    }

    public List<EventResponseDTO> getMyEvents() {
        Long clientId = currentUserService.requireCurrentClientId();
        return eventRepository.findByClient_ClientIdOrderByEventDateTimeAsc(clientId)
                .stream().map(eventService::toResponseDTO).toList();
    }

    public PortalEventDetailResponseDTO getMyEventDetail(Long eventId) {
        Event event = requireOwnedEvent(eventId);
        PortalEventDetailResponseDTO detail = new PortalEventDetailResponseDTO();
        detail.setEvent(eventService.toResponseDTO(event));
        detail.setMenuSelections(selectionService.getSelectionsForEvent(eventId));
        detail.setRentals(inventoryAllocationService.getInventoryAllocationsByEventId(eventId));
        detail.setQuotations(quotationService.getQuotationsByEventId(eventId));
        detail.setInvoices(invoiceService.getInvoicesByEventId(eventId));
        return detail;
    }

    @Transactional
    public PortalEventDetailResponseDTO createInquiry(PortalEventCreateRequest request) {
        Client client = currentUserService.requireCurrentClient();
        eventConflictService.assertNoConfirmedConflict(request.getEventDateTime(), null);

        Event event = new Event();
        event.setEventName(request.getEventName());
        event.setGuestCount(request.getGuestCount());
        event.setEventVenue(request.getEventVenue());
        event.setEventLocation(request.getEventLocation());
        event.setEventDateTime(request.getEventDateTime());
        event.setEventEndDateTime(request.getEventEndDateTime());
        event.setSpecialRequests(request.getSpecialRequests());
        event.setEventStatus(EventStatus.INQUIRY);
        event.setClient(client);
        Event saved = eventRepository.save(event);

        if (request.getMenuPackageIds() != null) {
            for (Long packageId : request.getMenuPackageIds()) {
                EventMenuPackageSelectionRequestDTO selection = new EventMenuPackageSelectionRequestDTO();
                selection.setEventId(saved.getEventId());
                selection.setMenuPackageId(packageId);
                selectionService.selectPackageForEvent(selection);
            }
        }

        return getMyEventDetail(saved.getEventId());
    }

    @Transactional
    public PortalEventDetailResponseDTO updateMyEvent(Long eventId, PortalEventUpdateRequest request) {
        Event event = requireOwnedEvent(eventId);

        if (event.getEventStatus() == EventStatus.CANCELLED || event.getEventStatus() == EventStatus.COMPLETED) {
            throw new IllegalStateException("A " + event.getEventStatus().name().toLowerCase()
                    + " booking can no longer be edited");
        }

        if (request.getEventDateTime() != null && !request.getEventDateTime().equals(event.getEventDateTime())) {
            if (request.getEventDateTime().isBefore(OffsetDateTime.now())) {
                throw new IllegalArgumentException("Event date must be in the future");
            }
            eventConflictService.assertNoConfirmedConflict(request.getEventDateTime(), eventId);
            event.setEventDateTime(request.getEventDateTime());
        }
        if (request.getEventEndDateTime() != null) {
            event.setEventEndDateTime(request.getEventEndDateTime());
        }
        if (request.getEventName() != null && !request.getEventName().isBlank()) {
            event.setEventName(request.getEventName());
        }
        if (request.getGuestCount() != null && request.getGuestCount() > 0) {
            event.setGuestCount(request.getGuestCount());
        }
        if (request.getEventVenue() != null && !request.getEventVenue().isBlank()) {
            event.setEventVenue(request.getEventVenue());
        }
        if (request.getEventLocation() != null) {
            event.setEventLocation(request.getEventLocation());
        }
        if (request.getSpecialRequests() != null) {
            event.setSpecialRequests(request.getSpecialRequests());
        }
        eventRepository.save(event);

        if (request.getMenuPackageIds() != null) {
            List<EventMenuPackageSelectionResponseDTO> existing = selectionService.getSelectionsForEvent(eventId);
            for (EventMenuPackageSelectionResponseDTO selection : existing) {
                selectionService.removeSelection(selection.getSelectionId());
            }
            for (Long packageId : request.getMenuPackageIds()) {
                EventMenuPackageSelectionRequestDTO selection = new EventMenuPackageSelectionRequestDTO();
                selection.setEventId(eventId);
                selection.setMenuPackageId(packageId);
                selectionService.selectPackageForEvent(selection);
            }
        }

        return getMyEventDetail(eventId);
    }

    @Transactional
    public PortalCancellationResponseDTO cancelMyEvent(Long eventId) {
        Event event = requireOwnedEvent(eventId);

        if (event.getEventStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("This booking is already cancelled");
        }
        if (event.getEventStatus() == EventStatus.COMPLETED) {
            throw new IllegalStateException("A completed event cannot be cancelled");
        }

        BigDecimal totalPaid = invoiceRepository.findByEvent_EventId(eventId).stream()
                .map(i -> i.getAmountPaid() != null ? i.getAmountPaid() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        event.setEventStatus(EventStatus.CANCELLED);
        Event saved = eventRepository.save(event);

        Payment refund = paymentService.processCancellationRefund(saved);

        PortalCancellationResponseDTO dto = new PortalCancellationResponseDTO();
        dto.setEvent(eventService.toResponseDTO(saved));
        dto.setTotalPaid(totalPaid);
        dto.setRefundAmount(refund != null ? refund.getAmount() : BigDecimal.ZERO);
        dto.setRefundReference(refund != null ? refund.getMpesaReceiptNumber() : null);
        dto.setMessage(refund != null
                ? "Booking cancelled. Per our 75% refund policy, KSh " + refund.getAmount()
                        + " will be returned to you (ref " + refund.getMpesaReceiptNumber() + ")."
                : "Booking cancelled. No payments had been made, so no refund is due.");
        return dto;
    }

    public List<QuotationResponseDTO> getMyQuotations() {
        Long clientId = currentUserService.requireCurrentClientId();
        return quotationRepository.findByEvent_Client_ClientIdOrderByCreatedAtDesc(clientId)
                .stream().map(quotationService::toResponseDTO).toList();
    }

    public QuotationResponseDTO getMyQuotation(Long quotationId) {
        Long clientId = currentUserService.requireCurrentClientId();
        Quotation quotation = quotationRepository.findByQuotationIdAndEvent_Client_ClientId(quotationId, clientId)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found"));
        return quotationService.toResponseDTO(quotation);
    }

    @Transactional
    public InvoiceResponseDTO acceptQuotation(Long quotationId) {
        requireOwnedQuotation(quotationId);
        return quotationService.acceptSentQuotation(quotationId);
    }

    @Transactional
    public QuotationResponseDTO declineQuotation(Long quotationId) {
        requireOwnedQuotation(quotationId);
        return quotationService.declineQuotation(quotationId);
    }

    public List<InvoiceResponseDTO> getMyInvoices() {
        Long clientId = currentUserService.requireCurrentClientId();
        return invoiceRepository.findByEvent_Client_ClientIdOrderByCreatedAtDesc(clientId)
                .stream().map(invoiceService::toResponseDTO).toList();
    }

    public InvoiceResponseDTO getMyInvoice(Long invoiceId) {
        Long clientId = currentUserService.requireCurrentClientId();
        Invoice invoice = invoiceRepository.findByInvoiceIdAndEvent_Client_ClientId(invoiceId, clientId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found"));
        return invoiceService.toResponseDTO(invoice);
    }

    @Transactional
    public PaymentResponseDTO payInvoice(Long invoiceId, PortalPayRequest request) {
        Long clientId = currentUserService.requireCurrentClientId();
        Invoice invoice = invoiceRepository.findByInvoiceIdAndEvent_Client_ClientId(invoiceId, clientId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found"));
        return paymentService.initiateMpesaPayment(invoice, request.getAmount(), request.getPhoneNumber());
    }

    public PaymentStatusResponseDTO getPaymentStatus(Long paymentId) {
        Long clientId = currentUserService.requireCurrentClientId();
        return paymentService.getPaymentStatus(paymentId, clientId);
    }

    public PaymentStatusResponseDTO confirmPaymentReceipt(Long paymentId, String mpesaReceiptNumber) {
        Long clientId = currentUserService.requireCurrentClientId();
        return paymentService.confirmMpesaReceipt(paymentId, clientId, mpesaReceiptNumber);
    }

    public List<MenuPackageResponseDTO> getMenuPackages() {
        return menuPackageService.getAllMenuPackages();
    }

    public List<MenuCategoryResponseDto> getMenuCategories() {
        return menuCategoryService.getAllCategories();
    }

    private Event requireOwnedEvent(Long eventId) {
        Long clientId = currentUserService.requireCurrentClientId();
        return eventRepository.findByEventIdAndClient_ClientId(eventId, clientId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
    }

    private Quotation requireOwnedQuotation(Long quotationId) {
        Long clientId = currentUserService.requireCurrentClientId();
        return quotationRepository.findByQuotationIdAndEvent_Client_ClientId(quotationId, clientId)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found"));
    }

    private List<PortalActivityItemDTO> synthesizeActivity(Long clientId, List<Event> events, List<Invoice> invoices) {
        List<PortalActivityItemDTO> items = new ArrayList<>();

        for (Invoice invoice : invoices) {
            PortalActivityItemDTO item = new PortalActivityItemDTO();
            item.setType("INVOICE");
            item.setTitle("Invoice " + invoice.getInvoiceNumber());
            item.setDescription("Status: " + invoice.getInvoiceStatus() + " · Balance KSh "
                    + (invoice.getBalance() != null ? invoice.getBalance() : "0"));
            item.setOccurredAt(invoice.getCreatedAt());
            items.add(item);
        }

        List<Payment> payments = paymentRepository.findAll().stream()
                .filter(p -> p.getInvoice() != null
                        && p.getInvoice().getEvent() != null
                        && p.getInvoice().getEvent().getClient() != null
                        && clientId.equals(p.getInvoice().getEvent().getClient().getClientId()))
                .toList();
        for (Payment payment : payments) {
            PortalActivityItemDTO item = new PortalActivityItemDTO();
            item.setType("PAYMENT");
            item.setTitle("Payment " + payment.getPaymentStatus());
            item.setDescription("KSh " + payment.getAmount() + " via " + payment.getPaymentMethod()
                    + (payment.getMpesaReceiptNumber() != null ? " · Receipt " + payment.getMpesaReceiptNumber() : ""));
            item.setOccurredAt(payment.getCompletedAt() != null ? payment.getCompletedAt() : payment.getInitiatedAt());
            items.add(item);
        }

        List<Quotation> quotations = quotationRepository.findByEvent_Client_ClientIdOrderByCreatedAtDesc(clientId);
        for (Quotation quotation : quotations) {
            PortalActivityItemDTO item = new PortalActivityItemDTO();
            item.setType("QUOTATION");
            item.setTitle("Quotation " + quotation.getQuotationNumber());
            item.setDescription(quotation.getQuotationName() + " · " + quotation.getQuotationStatus());
            item.setOccurredAt(quotation.getCreatedAt());
            items.add(item);
        }

        for (Event event : events) {
            PortalActivityItemDTO item = new PortalActivityItemDTO();
            item.setType("EVENT");
            item.setTitle(event.getEventName());
            item.setDescription("Status: " + event.getEventStatus() + " · " + event.getEventVenue());
            item.setOccurredAt(event.getCreatedAt() != null ? event.getCreatedAt() : event.getEventDateTime());
            items.add(item);
        }

        return items.stream()
                .sorted(Comparator.comparing(PortalActivityItemDTO::getOccurredAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(12)
                .toList();
    }

    private PortalProfileResponseDTO toProfile(Client client) {
        PortalProfileResponseDTO dto = new PortalProfileResponseDTO();
        dto.setClientId(client.getClientId());
        dto.setFirstName(client.getFirstName());
        dto.setLastName(client.getLastName());
        dto.setFullName((client.getFirstName() + " " + (client.getLastName() == null ? "" : client.getLastName())).trim());
        dto.setClientEmail(client.getClientEmail());
        dto.setClientPhone(client.getClientPhone());
        dto.setCompanyName(client.getCompanyName());
        dto.setProfileImageUrl(client.getProfileImageUrl());
        return dto;
    }
}
