-- Reemplaza el enfoque de tabla separada por una columna en bank_transactions
-- El usuario marca movimientos importados como "gasto fijo mensual"

ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN NOT NULL DEFAULT false;

DROP TABLE IF EXISTS fixed_expenses;
