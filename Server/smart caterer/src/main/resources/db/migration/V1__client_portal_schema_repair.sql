-- Schema drift repair for the client portal release.
--
-- Hibernate runs with ddl-auto: update, which adds columns but never alters an
-- existing CHECK constraint or column type. Two changes in this release need a
-- manual migration:
--   1. Role gained CLIENT, but app_users_role_check still only allowed ADMIN.
--   2. Invoice.invoiceStatus gained @Enumerated(STRING); the column was still
--      smallint holding ordinals.
--
-- Safe to re-run.

BEGIN;

-- 1. Allow CLIENT accounts -----------------------------------------------------
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE app_users
    ADD CONSTRAINT app_users_role_check
    CHECK (role IN ('ADMIN', 'CLIENT'));

-- 2. Convert invoice_status from ordinal smallint to varchar --------------------
-- Ordinals follow the original declaration order of InvoiceStatus:
--   0=PAID 1=UNPAID 2=PARTIALLY_PAID 3=OVERDUE 4=CANCELLED
ALTER TABLE invoice DROP CONSTRAINT IF EXISTS invoice_invoice_status_check;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'invoice'
          AND column_name = 'invoice_status'
          AND data_type IN ('smallint', 'integer')
    ) THEN
        ALTER TABLE invoice
            ALTER COLUMN invoice_status TYPE varchar(32)
            USING CASE invoice_status
                WHEN 0 THEN 'PAID'
                WHEN 1 THEN 'UNPAID'
                WHEN 2 THEN 'PARTIALLY_PAID'
                WHEN 3 THEN 'OVERDUE'
                WHEN 4 THEN 'CANCELLED'
                ELSE 'UNPAID'
            END;
    END IF;
END $$;

ALTER TABLE invoice
    ADD CONSTRAINT invoice_invoice_status_check
    CHECK (invoice_status IN ('PAID', 'UNPAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'));

COMMIT;

-- Adding a value to any @Enumerated(STRING) enum in future requires the same
-- drop/re-add of that column's *_check constraint.
