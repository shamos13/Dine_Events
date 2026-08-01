package com.dineevents.report.Service;

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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds admin reports straight from live database records (payments, invoices,
 * events, clients, feedback) — nothing here is static or precomputed.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM yyyy");
    private static final int MONTHS_BACK = 6;

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final EventRepository eventRepository;
    private final ClientRepository clientRepository;
    private final FeedbackRepository feedbackRepository;
    private final PaymentService paymentService;
    private final EventService eventService;

    public FinancialReportDTO getFinancialReport() {
        List<Payment> successful = paymentRepository.findByPaymentStatus((PaymentStatus.COMPLETED));
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
        dto.setTotalOutstanding(invoices.stream()
                .filter(i -> i.getInvoiceStatus() != InvoiceStatus.CANCELLED)
                .map(i -> i.getBalance() != null ? i.getBalance() : BigDecimal.ZERO)
                .filter(b -> b.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        dto.setInvoiceCount(invoices.size());
        dto.setPaidInvoiceCount(invoices.stream()
                .filter(i -> i.getInvoiceStatus() == InvoiceStatus.PAID)
                .count());

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

        return dto;
    }

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

    private static BigDecimal sumAmounts(List<Payment> payments) {
        return payments.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
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
