package com.dineevents.Quotation.Controller;


import com.dineevents.Quotation.DTO.QuotationResponseDTO;
import com.dineevents.Quotation.Service.QuotationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/quotation")
public class QuotationController {

    private final QuotationService quotationService;

    @PostMapping("/generate/{eventId}")
    public ResponseEntity<QuotationResponseDTO> createQuotation(@PathVariable Long eventId,
                                                                @RequestParam(required = false) LocalDate validUntil){

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quotationService.createQuotation(eventId, validUntil));

    }
}
