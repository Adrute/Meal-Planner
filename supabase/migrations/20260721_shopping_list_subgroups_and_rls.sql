-- Añade agrupación manual (subgroup) y orden manual (position) a la lista de la compra.
-- También activa RLS: shopping_list_items no tenía protección y era accesible
-- sin autenticación vía la Data API con la anon key (verificado con petición anónima).

ALTER TABLE shopping_list_items ADD COLUMN IF NOT EXISTS subgroup text;
ALTER TABLE shopping_list_items ADD COLUMN IF NOT EXISTS position integer;

-- Backfill de position para las filas existentes, respetando el orden actual
-- (agrupado por tienda, ordenado por fecha de creación)
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY store ORDER BY created_at) - 1 AS rn
  FROM shopping_list_items
)
UPDATE shopping_list_items
SET position = ranked.rn
FROM ranked
WHERE shopping_list_items.id = ranked.id;

-- RLS: datos familiares compartidos, cualquier miembro autenticado lee/escribe
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "familia_autenticada" ON shopping_list_items;
CREATE POLICY "familia_autenticada" ON shopping_list_items
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON shopping_list_items TO anon, authenticated;
