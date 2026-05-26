ALTER TABLE home_invoices
  ADD COLUMN billing_period_months INTEGER NOT NULL DEFAULT 2;
