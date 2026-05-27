-- Habilita RLS en tablas que quedaron sin protección.
-- El middleware proxy.ts solo protege rutas de Next.js; sin RLS el endpoint
-- directo de Supabase es accesible sin autenticación usando la anon key.
-- Todos los módulos aquí son datos familiares compartidos: cualquier miembro
-- autenticado puede leer y escribir.

-- Finanzas
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON bank_transactions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE category_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON category_rules
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON transaction_categories
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE transaction_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON transaction_subcategories
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Suministros
ALTER TABLE home_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON home_invoices
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Bonos/Servicios
ALTER TABLE service_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON service_passes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Recetas
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON recipes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON ingredients
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON recipe_ingredients
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Planificador de comidas
ALTER TABLE weekly_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON weekly_plan
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Restaurantes
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON restaurants
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE restaurant_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON restaurant_lists
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE restaurant_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON restaurant_list_items
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON reservations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE tag_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON tag_colors
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- GRANTs para la Data API (requeridos explícitamente desde mayo 2026
-- para tablas nuevas; las existentes los tienen implícitos, pero se
-- incluyen aquí para que este fichero sea autosuficiente como referencia)
GRANT ALL ON bank_transactions TO anon, authenticated;
GRANT ALL ON category_rules TO anon, authenticated;
GRANT ALL ON transaction_categories TO anon, authenticated;
GRANT ALL ON transaction_subcategories TO anon, authenticated;
GRANT ALL ON home_invoices TO anon, authenticated;
GRANT ALL ON service_passes TO anon, authenticated;
GRANT ALL ON recipes TO anon, authenticated;
GRANT ALL ON ingredients TO anon, authenticated;
GRANT ALL ON recipe_ingredients TO anon, authenticated;
GRANT ALL ON weekly_plan TO anon, authenticated;
GRANT ALL ON restaurants TO anon, authenticated;
GRANT ALL ON restaurant_lists TO anon, authenticated;
GRANT ALL ON restaurant_list_items TO anon, authenticated;
GRANT ALL ON reservations TO anon, authenticated;
GRANT ALL ON tag_colors TO anon, authenticated;
