package com.dineevents.feedback.Repository;

import com.dineevents.feedback.Entity.Feedback;
import com.dineevents.feedback.Enum.FeedbackStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findAllByOrderByCreatedAtDesc();

    List<Feedback> findByClient_ClientIdOrderByCreatedAtDesc(Long clientId);

    long countByFeedbackStatus(FeedbackStatus status);

    List<Feedback> findByFeedbackStatusOrderByCreatedAtDesc(FeedbackStatus status);
}
