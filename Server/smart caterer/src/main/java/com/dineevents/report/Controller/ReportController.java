package com.dineevents.report.Controller;

import com.dineevents.report.DTO.ClientsReportDTO;
import com.dineevents.report.DTO.EventsReportDTO;
import com.dineevents.report.DTO.FinancialReportDTO;
import com.dineevents.report.DTO.InventoryReportDTO;
import com.dineevents.report.DTO.StaffReportDTO;
import com.dineevents.report.Service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/financial")
    public ResponseEntity<FinancialReportDTO> getFinancialReport() {
        return ResponseEntity.ok(reportService.getFinancialReport());
    }

    @GetMapping("/events")
    public ResponseEntity<EventsReportDTO> getEventsReport() {
        return ResponseEntity.ok(reportService.getEventsReport());
    }

    @GetMapping("/clients")
    public ResponseEntity<ClientsReportDTO> getClientsReport() {
        return ResponseEntity.ok(reportService.getClientsReport());
    }

    @GetMapping("/staff")
    public ResponseEntity<StaffReportDTO> getStaffReport() {
        return ResponseEntity.ok(reportService.getStaffReport());
    }

    @GetMapping("/inventory")
    public ResponseEntity<InventoryReportDTO> getInventoryReport() {
        return ResponseEntity.ok(reportService.getInventoryReport());
    }
}
