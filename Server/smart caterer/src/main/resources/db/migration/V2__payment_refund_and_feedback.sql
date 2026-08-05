-- Schema repair for the cancellation-refund + feedback features.
-- Hibernate (ddl-auto: update) cannot alter existing CHECK constraints, so run this
-- manually against the dine_events database (like V1):
--   psql -d dine_events -f V2__payment_refund_and_feedback.sql

-- 1. Payments: allow the new REFUNDED status used by the simulated 75% refund policy.
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_status_check
    CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'));

-- 2. Feedback: table is created automatically by Hibernate. Nothing to repair, but for
--    reference its enum-backed columns are:
--      feedback_type   IN ('SUGGESTION', 'COMPLAINT', 'COMPLIMENT', 'QUESTION')
--      feedback_status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')
