package com.dineevents.report.Service;

import com.dineevents.Inventory.Entity.Inventory;
import com.dineevents.Inventory.Entity.InventoryItemAllocation;
import com.dineevents.Inventory.Repository.InventoryAllocationRepository;
import com.dineevents.Inventory.Repository.InventoryRepository;
import com.dineevents.Invoice.Entity.Invoice;
import com.dineevents.Invoice.Enum.InvoiceStatus;
import com.dineevents.Invoice.Repository.InvoiceRepository;
import com.dineevents.client.Entity.Client;
import com.dineevents.client.Repository.ClientRepository;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Enums.EventStatus;
import com.dineevents.event.Repository.EventRepository;
import com.dineevents.event.Service.EventService;
import com.dineevents.feedback.Enum.FeedbackStatus;
import com.dineevents.feedback.Repository.FeedbackRepository;
import com.dineevents.Payment.Entity.Payment;
import com.dineevents.Payment.Enum.PaymentStatus;
import com.dineevents.Payment.Repository.PaymentRepository;
import com.dineevents.Payment.Service.PaymentService;
import com.dineevents.report.DTO.ClientsReportDTO;
import com.dineevents.report.DTO.EventsReportDTO;
import com.dineevents.report.DTO.FinancialReportDTO;
import com.dineevents.report.DTO.InventoryReportDTO;
import com.dineevents.report.DTO.StaffReportDTO;
import com.dineevents.staff.Entity.Staff;
import com.dineevents.staff.Entity.StaffAssignment;
import com.dineevents.staff.Repository.StaffAssignmentRepository;
import com.dineevents.staff.Repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Builds admin reports straight from live database records (payments, invoices,
 * events, clients, feedback, staff, inventory) — nothing here is static or precomputed.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM yyyy");
    private static final int MONTHS_BACK = 6;
    private static final int LOW_STOCK_THRESHOLD = 5;

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final EventRepository eventRepository;
    private final ClientRepository clientRepository;
    private final FeedbackRepository feedbackRepository;
    private final PaymentService paymentService;
    private final EventService eventService;
    private final StaffRepository staffRepository;
    private final StaffAssignmentRepository staffAssignmentRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryAllocationRepository inventoryAllocationRepository;

    @Transactional(readOnly = true)
    public FinancialReportDTO getFinancialReport() {
        List<Payment> successful = paymentRepository.findByPaymentStatus(PaymentStatus.COMPLETED);
        List<Payment> refunded = paymentRepository.findByPaymentStatus(PaymentStatus.REFUNDED);
        List<Invoice> invoices = invoiceRepository.findAll();

        BigDecimal totalCollected = sumAmounts(successful);
        BigDecimal totalRefunded = sumAmounts(refunded);

        FinancialReportDTO dto = new FinancialReportDTO();
        dto.setTotalRevenue(totalCollected.subtract(totalRefunded));
        dto.setTotalRefunded(totalRefunded);
        dto.setTotalInvoiced(invoices.stream()
                .filter(i -> i.getInvoiceStatus() != InvoiceStatus.CANCELLED)
                .map(i -> i.getAmountDue() != null ? i.getAmountDue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        List<Invoice> outstanding = invoices.stream()
                .filter(i -> i.getInvoiceStatus() != InvoiceStatus.CANCELLED)
                .filter(i -> i.getBalance() != null && i.getBalance().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Comparator
                        .comparing((Invoice i) -> i.getDueDate() != null ? i.getDueDate() : LocalDate.MAX)
                        .thenComparing(Invoice::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        dto.setTotalOutstanding(outstanding.stream()
                .map(Invoice::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        dto.setOutstandingInvoiceCount(outstanding.size());
        dto.setOutstandingInvoices(outstanding.stream().map(this::toOutstandingEntry).toList());

        dto.setInvoiceCount(invoices.size());
        dto.setPaidInvoiceCount(invoices.stream()
                .filter(i -> i.getInvoiceStatus() == InvoiceStatus.PAID)
                .count());
        dto.setRefundCount(refunded.size());

        Map<YearMonth, FinancialReportDTO.MonthlyFinancialEntryDTO> months = lastMonthsFinancial();
        for (Payment payment : successful) {
            YearMonth month = monthOf(payment);
            FinancialReportDTO.MonthlyFinancialEntryDTO entry = months.get(month);
            if (entry != null) {
                entry.setCollected(entry.getCollected().add(payment.getAmount()));
                entry.setPaymentCount(entry.getPaymentCount() + 1);
            }
        }
        for (Payment payment : refunded) {
            YearMonth month = monthOf(payment);
            FinancialReportDTO.MonthlyFinancialEntryDTO entry = months.get(month);
            if (entry != null) {
                entry.setRefunded(entry.getRefunded().add(payment.getAmount()));
            }
        }
        months.values().forEach(e -> e.setNet(e.getCollected().subtract(e.getRefunded())));
        dto.setMonthly(new ArrayList<>(months.values()));

        List<Payment> allMovements = new ArrayList<>();
        allMovements.addAll(successful);
        allMovements.addAll(refunded);
        allMovements.sort(Comparator.comparing(
                (Payment p) -> p.getCompletedAt() != null ? p.getCompletedAt() : p.getInitiatedAt(),
                Comparator.nullsLast(Comparator.reverseOrder())));
        dto.setPayments(allMovements.stream().map(paymentService::toResponseDTO).toList());

        List<Payment> refundsSorted = new ArrayList<>(refunded);
        refundsSorted.sort(Comparator.comparing(
                (Payment p) -> p.getCompletedAt() != null ? p.getCompletedAt() : p.getInitiatedAt(),
                Comparator.nullsLast(Comparator.reverseOrder())));
        dto.setRefunds(refundsSorted.stream().map(paymentService::toResponseDTO).toList());

        return dto;
    }

    @Transactional(readOnly = true)
    public EventsReportDTO getEventsReport() {
        List<Event> events = eventRepository.findAll();
        OffsetDateTime now = OffsetDateTime.now();

        EventsReportDTO dto = new EventsReportDTO();
        dto.setTotalEvents(events.size());

        Map<String, Long> statusCounts = new LinkedHashMap<>();
        for (EventStatus status : EventStatus.values()) {
            statusCounts.put(status.name(),
                    events.stream().filter(e -> e.getEventStatus() == status).count());
        }
        dto.setStatusCounts(statusCounts);

        dto.setUpcomingCount(events.stream()
                .filter(e -> e.getEventDateTime() != null && e.getEventDateTime().isAfter(now))
                .filter(e -> e.getEventStatus() != EventStatus.CANCELLED)
                .count());
        dto.setTotalGuests(events.stream()
                .filter(e -> e.getEventStatus() != EventStatus.CANCELLED)
                .mapToLong(Event::getGuestCount)
                .sum());

        Map<YearMonth, EventsReportDTO.MonthlyCountEntryDTO> months = lastMonthsEvents();
        for (Event event : events) {
            if (event.getEventDateTime() == null || event.getEventStatus() == EventStatus.CANCELLED) {
                continue;
            }
            EventsReportDTO.MonthlyCountEntryDTO entry = months.get(YearMonth.from(event.getEventDateTime()));
            if (entry != null) {
                entry.setCount(entry.getCount() + 1);
                entry.setGuests(entry.getGuests() + event.getGuestCount());
            }
        }
        dto.setMonthly(new ArrayList<>(months.values()));

        dto.setEvents(events.stream()
                .sorted(Comparator.comparing(Event::getEventDateTime,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(eventService::toResponseDTO)
                .toList());
        return dto;
    }

    @Transactional(readOnly = true)
    public ClientsReportDTO getClientsReport() {
        List<Client> clients = clientRepository.findAll();

        ClientsReportDTO dto = new ClientsReportDTO();
        dto.setTotalClients(clients.size());
        dto.setOpenFeedbackCount(feedbackRepository.countByFeedbackStatus(FeedbackStatus.OPEN));
        dto.setInProgressFeedbackCount(feedbackRepository.countByFeedbackStatus(FeedbackStatus.IN_PROGRESS));
        dto.setResolvedFeedbackCount(feedbackRepository.countByFeedbackStatus(FeedbackStatus.RESOLVED));

        List<ClientsReportDTO.TopClientEntryDTO> top = new ArrayList<>();
        for (Client client : clients) {
            List<Event> events = eventRepository.findByClient_ClientIdOrderByEventDateTimeAsc(client.getClientId());
            BigDecimal totalPaid = invoiceRepository
                    .findByEvent_Client_ClientIdOrderByCreatedAtDesc(client.getClientId())
                    .stream()
                    .map(i -> i.getAmountPaid() != null ? i.getAmountPaid() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            ClientsReportDTO.TopClientEntryDTO entry = new ClientsReportDTO.TopClientEntryDTO();
            entry.setClientId(client.getClientId());
            entry.setClientName((client.getFirstName() + " "
                    + (client.getLastName() == null ? "" : client.getLastName())).trim());
            entry.setCompanyName(client.getCompanyName());
            entry.setClientEmail(client.getClientEmail());
            entry.setEventCount(events.size());
            entry.setTotalPaid(totalPaid);
            top.add(entry);
        }
        top.sort(Comparator.comparing(ClientsReportDTO.TopClientEntryDTO::getTotalPaid).reversed());
        dto.setTopClients(top);
        return dto;
    }

    @Transactional(readOnly = true)
    public StaffReportDTO getStaffReport() {
        List<Staff> staffList = staffRepository.findAll();
        List<StaffAssignment> assignments = staffAssignmentRepository.findAll();

        Map<Long, List<StaffAssignment>> byStaff = assignments.stream()
                .filter(a -> a.getStaff() != null)
                .collect(Collectors.groupingBy(a -> a.getStaff().getStaffId()));

        StaffReportDTO dto = new StaffReportDTO();
        dto.setTotalStaff(staffList.size());
        dto.setTotalAssignments(assignments.size());
        dto.setTotalAssignmentCost(assignments.stream()
                .map(a -> a.getSalaryAtAssignment() != null ? a.getSalaryAtAssignment() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        Map<String, Long> roleCounts = new LinkedHashMap<>();
        for (Staff staff : staffList) {
            String role = staff.getStaffRole() != null && !staff.getStaffRole().isBlank()
                    ? staff.getStaffRole()
                    : "Unspecified";
            roleCounts.merge(role, 1L, Long::sum);
        }
        dto.setRoleCounts(roleCounts);

        List<StaffReportDTO.StaffUtilizationEntryDTO> utilization = new ArrayList<>();
        long unassigned = 0;
        for (Staff staff : staffList) {
            List<StaffAssignment> staffAssignments = byStaff.getOrDefault(staff.getStaffId(), List.of());
            if (staffAssignments.isEmpty()) {
                unassigned++;
            }
            StaffReportDTO.StaffUtilizationEntryDTO entry = new StaffReportDTO.StaffUtilizationEntryDTO();
            entry.setStaffId(staff.getStaffId());
            entry.setStaffName(staff.getStaffName());
            entry.setStaffRole(staff.getStaffRole());
            entry.setStaffEmail(staff.getStaffEmail());
            entry.setStaffPhone(staff.getStaffPhone());
            entry.setStaffSalary(staff.getStaffSalary());
            entry.setPricingMethod(staff.getPricingMethod());
            entry.setAssignmentCount(staffAssignments.size());
            entry.setTotalEarned(staffAssignments.stream()
                    .map(a -> a.getSalaryAtAssignment() != null ? a.getSalaryAtAssignment() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            utilization.add(entry);
        }
        utilization.sort(Comparator
                .comparing(StaffReportDTO.StaffUtilizationEntryDTO::getAssignmentCount).reversed()
                .thenComparing(StaffReportDTO.StaffUtilizationEntryDTO::getStaffName,
                        Comparator.nullsLast(String::compareToIgnoreCase)));
        dto.setStaff(utilization);
        dto.setUnassignedStaffCount(unassigned);

        List<StaffReportDTO.StaffAssignmentEntryDTO> assignmentEntries = assignments.stream()
                .sorted(Comparator.comparing(
                        (StaffAssignment a) -> a.getEvent() != null ? a.getEvent().getEventDateTime() : null,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toStaffAssignmentEntry)
                .toList();
        dto.setAssignments(assignmentEntries);
        return dto;
    }

    @Transactional(readOnly = true)
    public InventoryReportDTO getInventoryReport() {
        List<Inventory> items = inventoryRepository.findAll();
        List<InventoryItemAllocation> allocations = inventoryAllocationRepository.findAll();

        InventoryReportDTO dto = new InventoryReportDTO();
        dto.setTotalItems(items.size());

        long totalStock = 0;
        long totalAllocated = 0;
        long lowStock = 0;
        long outOfStock = 0;
        List<InventoryReportDTO.InventoryStockEntryDTO> stockEntries = new ArrayList<>();

        for (Inventory item : items) {
            int stock = item.getInventoryQuantity() != null ? item.getInventoryQuantity() : 0;
            Long allocatedSum = inventoryAllocationRepository.sumAllocatedQuantity(
                    item.getInventoryId(), EventStatus.CANCELLED, null);
            int allocated = allocatedSum == null ? 0 : allocatedSum.intValue();
            int available = Math.max(0, stock - allocated);

            totalStock += stock;
            totalAllocated += allocated;
            if (available == 0) {
                outOfStock++;
            } else if (available <= LOW_STOCK_THRESHOLD) {
                lowStock++;
            }

            InventoryReportDTO.InventoryStockEntryDTO entry = new InventoryReportDTO.InventoryStockEntryDTO();
            entry.setInventoryId(item.getInventoryId());
            entry.setInventoryName(item.getInventoryName());
            entry.setStockQuantity(stock);
            entry.setAllocatedQuantity(allocated);
            entry.setAvailableQuantity(available);
            entry.setUnitPrice(item.getUnitPrice());
            entry.setStockValue(item.getUnitPrice() != null
                    ? item.getUnitPrice().multiply(BigDecimal.valueOf(stock))
                    : BigDecimal.ZERO);
            entry.setUtilizationPercent(stock == 0
                    ? 0
                    : BigDecimal.valueOf(allocated)
                            .multiply(BigDecimal.valueOf(100))
                            .divide(BigDecimal.valueOf(stock), 0, RoundingMode.HALF_UP)
                            .intValue());
            stockEntries.add(entry);
        }

        stockEntries.sort(Comparator
                .comparing(InventoryReportDTO.InventoryStockEntryDTO::getAvailableQuantity)
                .thenComparing(InventoryReportDTO.InventoryStockEntryDTO::getInventoryName,
                        Comparator.nullsLast(String::compareToIgnoreCase)));

        dto.setTotalStockUnits(totalStock);
        dto.setTotalAllocatedUnits(totalAllocated);
        dto.setLowStockCount(lowStock);
        dto.setOutOfStockCount(outOfStock);
        dto.setItems(stockEntries);

        dto.setTotalAllocationValue(allocations.stream()
                .filter(a -> a.getEvent() == null || a.getEvent().getEventStatus() != EventStatus.CANCELLED)
                .map(a -> a.getTotalCost() != null ? a.getTotalCost() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        List<InventoryReportDTO.InventoryAllocationEntryDTO> allocationEntries = allocations.stream()
                .sorted(Comparator.comparing(
                        (InventoryItemAllocation a) -> a.getEvent() != null ? a.getEvent().getEventDateTime() : null,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toInventoryAllocationEntry)
                .toList();
        dto.setAllocations(allocationEntries);
        return dto;
    }

    private FinancialReportDTO.OutstandingInvoiceEntryDTO toOutstandingEntry(Invoice invoice) {
        FinancialReportDTO.OutstandingInvoiceEntryDTO entry = new FinancialReportDTO.OutstandingInvoiceEntryDTO();
        entry.setInvoiceId(invoice.getInvoiceId());
        entry.setInvoiceNumber(invoice.getInvoiceNumber());
        if (invoice.getEvent() != null) {
            entry.setEventId(invoice.getEvent().getEventId());
            entry.setEventName(invoice.getEvent().getEventName());
            if (invoice.getEvent().getClient() != null) {
                Client client = invoice.getEvent().getClient();
                entry.setClientName((client.getFirstName() + " "
                        + (client.getLastName() == null ? "" : client.getLastName())).trim());
            }
        }
        entry.setAmountDue(invoice.getAmountDue());
        entry.setAmountPaid(invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO);
        entry.setBalance(invoice.getBalance());
        entry.setDueDate(invoice.getDueDate());
        entry.setInvoiceStatus(invoice.getInvoiceStatus());
        entry.setCreatedAt(invoice.getCreatedAt());
        boolean overdue = invoice.getInvoiceStatus() == InvoiceStatus.OVERDUE
                || (invoice.getDueDate() != null && invoice.getDueDate().isBefore(LocalDate.now()));
        entry.setOverdue(overdue);
        return entry;
    }

    private StaffReportDTO.StaffAssignmentEntryDTO toStaffAssignmentEntry(StaffAssignment assignment) {
        StaffReportDTO.StaffAssignmentEntryDTO entry = new StaffReportDTO.StaffAssignmentEntryDTO();
        entry.setStaffAssignmentId(assignment.getStaffAssignmentId());
        if (assignment.getStaff() != null) {
            entry.setStaffId(assignment.getStaff().getStaffId());
            entry.setStaffName(assignment.getStaff().getStaffName());
            entry.setStaffRole(assignment.getStaff().getStaffRole());
        }
        entry.setRoleForEvent(assignment.getRoleForEvent());
        if (assignment.getEvent() != null) {
            entry.setEventId(assignment.getEvent().getEventId());
            entry.setEventName(assignment.getEvent().getEventName());
            entry.setEventStatus(assignment.getEvent().getEventStatus() != null
                    ? assignment.getEvent().getEventStatus().name()
                    : null);
            entry.setEventDateTime(assignment.getEvent().getEventDateTime() != null
                    ? assignment.getEvent().getEventDateTime().toString()
                    : null);
        }
        entry.setSalaryAtAssignment(assignment.getSalaryAtAssignment());
        entry.setAssignmentStatus(assignment.getAssignmentStatus() != null
                ? assignment.getAssignmentStatus().name()
                : null);
        return entry;
    }

    private InventoryReportDTO.InventoryAllocationEntryDTO toInventoryAllocationEntry(
            InventoryItemAllocation allocation) {
        InventoryReportDTO.InventoryAllocationEntryDTO entry = new InventoryReportDTO.InventoryAllocationEntryDTO();
        entry.setAllocationId(allocation.getAllocationId());
        if (allocation.getInventory() != null) {
            entry.setInventoryId(allocation.getInventory().getInventoryId());
            entry.setInventoryName(allocation.getInventory().getInventoryName());
        }
        if (allocation.getEvent() != null) {
            entry.setEventId(allocation.getEvent().getEventId());
            entry.setEventName(allocation.getEvent().getEventName());
            entry.setEventStatus(allocation.getEvent().getEventStatus() != null
                    ? allocation.getEvent().getEventStatus().name()
                    : null);
            if (allocation.getEvent().getClient() != null) {
                Client client = allocation.getEvent().getClient();
                entry.setClientName((client.getFirstName() + " "
                        + (client.getLastName() == null ? "" : client.getLastName())).trim());
            }
        }
        entry.setPricingType(allocation.getPricingType());
        entry.setQuantityAllocated(allocation.getQuantityAllocated());
        entry.setQuantityReturned(allocation.getQuantityReturned());
        entry.setTotalCost(allocation.getTotalCost());
        return entry;
    }

    private static BigDecimal sumAmounts(List<Payment> payments) {
        return payments.stream()
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static YearMonth monthOf(Payment payment) {
        OffsetDateTime when = payment.getCompletedAt() != null
                ? payment.getCompletedAt()
                : payment.getInitiatedAt();
        return when != null ? YearMonth.from(when) : YearMonth.now();
    }

    private static Map<YearMonth, FinancialReportDTO.MonthlyFinancialEntryDTO> lastMonthsFinancial() {
        Map<YearMonth, FinancialReportDTO.MonthlyFinancialEntryDTO> months = new LinkedHashMap<>();
        YearMonth current = YearMonth.now();
        for (int i = MONTHS_BACK - 1; i >= 0; i--) {
            YearMonth month = current.minusMonths(i);
            FinancialReportDTO.MonthlyFinancialEntryDTO entry = new FinancialReportDTO.MonthlyFinancialEntryDTO();
            entry.setMonth(month.atDay(1).format(MONTH_LABEL));
            entry.setCollected(BigDecimal.ZERO);
            entry.setRefunded(BigDecimal.ZERO);
            entry.setNet(BigDecimal.ZERO);
            months.put(month, entry);
        }
        return months;
    }

    private static Map<YearMonth, EventsReportDTO.MonthlyCountEntryDTO> lastMonthsEvents() {
        Map<YearMonth, EventsReportDTO.MonthlyCountEntryDTO> months = new LinkedHashMap<>();
        YearMonth current = YearMonth.now();
        // Events look forward too, so cover recent history plus the next few months.
        for (int i = MONTHS_BACK - 1; i >= -3; i--) {
            YearMonth month = current.minusMonths(i);
            EventsReportDTO.MonthlyCountEntryDTO entry = new EventsReportDTO.MonthlyCountEntryDTO();
            entry.setMonth(month.atDay(1).format(MONTH_LABEL));
            months.put(month, entry);
        }
        return months;
    }
}
