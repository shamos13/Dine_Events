package com.dineevents.communication.DTO.Request;

import com.dineevents.communication.Enum.MessageKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventMessageRequest {

    @NotBlank
    @Size(max = 4000)
    private String body;

    private Long quotationId;

    private MessageKind messageKind;
}
