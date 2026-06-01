-- Patrones de gastos fijos: cuando el usuario marca un movimiento como fijo,
-- se guarda el concepto_original como patrón para auto-detectar futuros imports

CREATE TABLE fixed_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  label TEXT,
  UNIQUE(pattern),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fixed_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON fixed_patterns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON fixed_patterns TO anon, authenticated;
