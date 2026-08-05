-- Allow SUPERSEDED quotation status used when a revised proposal replaces older ones.
-- Hibernate (ddl-auto: update) cannot alter existing CHECK constraints.
-- Run against dine_events:
--   psql -d dine_events -f V5__quotation_superseded_status.sql

ALTER TABLE quotation DROP CONSTRAINT IF EXISTS quotation_quotation_status_check;
ALTER TABLE quotation DROP CONSTRAINT IF EXISTS quotations_quotation_status_check;

ALTER TABLE quotation
    ADD CONSTRAINT quotation_quotation_status_check
    CHECK (quotation_status IN (
        'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'SUPERSEDED'
    ));
