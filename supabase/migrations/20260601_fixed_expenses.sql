CREATE TABLE fixed_expenses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  amount     NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  period     TEXT NOT NULL DEFAULT 'monthly'
             CHECK (period IN ('monthly','bimonthly','quarterly','biannual','annual')),
  category   TEXT,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON fixed_expenses
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON fixed_expenses TO anon, authenticated;
