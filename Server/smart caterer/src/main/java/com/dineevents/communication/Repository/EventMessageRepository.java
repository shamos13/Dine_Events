package com.dineevents.communication.Repository;

import com.dineevents.communication.Entity.EventMessage;
import com.dineevents.communication.Enum.MessageSender;
import com.dineevents.event.Entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventMessageRepository extends JpaRepository<EventMessage, Long> {

    List<EventMessage> findByEventOrderByCreatedAtAsc(Event event);

    List<EventMessage> findByEvent_EventIdOrderByCreatedAtAsc(Long eventId);

    long countByEvent_EventIdAndSenderAndReadByAdminFalse(Long eventId, MessageSender sender);

    long countBySenderAndReadByAdminFalse(MessageSender sender);

    List<EventMessage> findBySenderAndReadByAdminFalseOrderByCreatedAtDesc(MessageSender sender);
}
