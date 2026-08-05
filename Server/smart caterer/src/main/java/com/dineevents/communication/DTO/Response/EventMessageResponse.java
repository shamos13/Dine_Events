package com.dineevents.communication.DTO.Response;

import com.dineevents.communication.Enum.MessageKind;
import com.dineevents.communication.Enum.MessageSender;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventMessageResponse {
    private Long messageId;
    private Long eventId;
    private Long quotationId;
    private String quotationNumber;
    private MessageSender sender;
    private MessageKind messageKind;
    private String body;
    private boolean readByAdmin;
    private boolean readByClient;
    private OffsetDateTime createdAt;
}
