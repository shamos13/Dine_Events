-- Ensure payment history only stores genuine Safaricom MpesaReceiptNumber values.
-- Synthetic CHK-* placeholders (from earlier reconciliation) are cleared.
-- Safe to re-run.

BEGIN;

-- Remove fake placeholders so late callbacks / support can set the real receipt.
UPDATE payments
SET mpesa_receipt_number = NULL
WHERE mpesa_receipt_number IS NOT NULL
  AND (
      mpesa_receipt_number ILIKE 'CHK-%'
      OR mpesa_receipt_number ILIKE 'ws_CO_%'
  );

-- Unique when present — the receipt is the cross-check key against M-Pesa statements.
CREATE UNIQUE INDEX IF NOT EXISTS uk_payments_mpesa_receipt_number
    ON payments (mpesa_receipt_number)
    WHERE mpesa_receipt_number IS NOT NULL;

COMMIT;
