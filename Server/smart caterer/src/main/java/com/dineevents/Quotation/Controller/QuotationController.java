package com.dineevents.Quotation.Controller;


import com.dineevents.Quotation.DTO.QuotationResponseDTO;
import com.dineevents.Quotation.DTO.Request.QuotationRequestDTO;
import com.dineevents.Quotation.Service.QuotationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/quotation")
public class QuotationController {

    private final QuotationService quotationService;

    @PostMapping("/generate")
    public ResponseEntity<QuotationResponseDTO> createQuotation(@Valid @RequestBody QuotationRequestDTO quotationRequestDTO){
        return ResponseEntity.status(HttpStatus.CREATED).body(quotationService.createQuotation(quotationRequestDTO));
    }

    @GetMapping("/all-quotations")
    public ResponseEntity<List<QuotationResponseDTO>> getAllQuotations(){
        return ResponseEntity.status(HttpStatus.OK).body(quotationService.getAllQuotations());
    }
}
