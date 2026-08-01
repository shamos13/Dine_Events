package com.dineevents.portal.DTO.Response;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class PortalActivityItemDTO {
    private String type;
    private String title;
    private String description;
    private OffsetDateTime occurredAt;
}
