package com.dineevents.admin.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotificationDTO {
    private String id;
    private String type;
    private String title;
    private String message;
    private String href;
    private OffsetDateTime createdAt;
}
