-- Schema repair for the hardened M-Pesa payment workflow.
-- Hibernate (ddl-auto: update) can add columns but cannot rename them or alter
-- CHECK constraints. Run manually against dine_events (like V1/V2):
--   psql -d dine_events -f src/main/resources/db/migration/V3__payment_mpesa_hardening_schema.sql
--
-- Safe to re-run.

BEGIN;

-- 1. Align payment_status with PaymentStatus enum (SUCCESS → COMPLETED) ---------
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_status_check;

UPDATE payments
SET payment_status = 'COMPLETED'
WHERE payment_status = 'SUCCESS';

ALTER TABLE payments
    ADD CONSTRAINT payments_payment_status_check
    CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'));

-- 2. Align payment_method with PaymentMethod enum (BANK_TRANSFER → BANK) -------
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;

UPDATE payments
SET payment_method = 'BANK'
WHERE payment_method = 'BANK_TRANSFER';

ALTER TABLE payments
    ADD CONSTRAINT payments_payment_method_check
    CHECK (payment_method IN ('MPESA', 'CASH', 'BANK'));

-- 3. Ensure initiated_at exists and is backfilled from legacy created_at -------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'payments'
          AND column_name = 'initiated_at'
    ) THEN
        ALTER TABLE payments ADD COLUMN initiated_at timestamptz;
    END IF;
END $$;

UPDATE payments
SET initiated_at = COALESCE(initiated_at, created_at, transaction_date, NOW())
WHERE initiated_at IS NULL;

ALTER TABLE payments
    ALTER COLUMN initiated_at SET NOT NULL;

-- 4. Backfill new column names from legacy M-Pesa fields -----------------------
UPDATE payments
SET checkout_request_id = COALESCE(checkout_request_id, mpesa_checkout_request_id)
WHERE checkout_request_id IS NULL
  AND mpesa_checkout_request_id IS NOT NULL;

UPDATE payments
SET merchant_request_id = COALESCE(merchant_request_id, mpesa_merchant_request_id)
WHERE merchant_request_id IS NULL
  AND mpesa_merchant_request_id IS NOT NULL;

UPDATE payments
SET failure_reason = COALESCE(failure_reason, result_desc)
WHERE failure_reason IS NULL
  AND result_desc IS NOT NULL;

UPDATE payments
SET completed_at = COALESCE(completed_at, transaction_date, initiated_at)
WHERE completed_at IS NULL
  AND payment_status IN ('COMPLETED', 'FAILED', 'REFUNDED');

-- STK sync acceptance text landed in legacy result_desc; clear it on PENDING rows
UPDATE payments
SET failure_reason = NULL
WHERE payment_status = 'PENDING'
  AND failure_reason = 'Success. Request accepted for processing';

-- 5. Ensure unique constraint on checkout_request_id ---------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'payments'::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) ILIKE '%checkout_request_id%'
    ) THEN
        ALTER TABLE payments
            ADD CONSTRAINT uk_payments_checkout_request_id UNIQUE (checkout_request_id);
    END IF;
END $$;

COMMIT;
