# Finanzas

## Página principal
`app/finances/page.tsx` — Server Component

### Datos cargados
- Transacciones del mes seleccionado (`selTx`) + todas las transacciones (`all`)
- Categorías con `is_income` flag
- Reglas de categorización automática

### Cálculo de gastos netos
Los ingresos en categorías NO marcadas como income se tratan como **reembolsos**:
```ts
const netCat = (transactions, categoryName) => {
  const gastosBrutos = Math.abs(tx.filter(t => t.categoria === cat && t.importe < 0).reduce(...))
  const reembolsos = tx.filter(t => t.categoria === cat && t.importe > 0).reduce(...)
  return Math.max(0, gastosBrutos - reembolsos)
}
```
Ejemplo: pagué 200€, me ingresan 100€ → gasto neto = 100€

Los ingresos en categorías `is_income = true` son ingresos reales (nómina, etc.).

## Componentes UI
- `finances-ui.tsx` — componente cliente principal, recibe `transactions`, `allTransactions`, `categories`, `rules`
- `finances-header.tsx` — botones de importar CSV y eliminar todo (en cabecera de página)
- `categories-manager.tsx` — gestión de categorías, prop `embedded` para modal sin wrapper

## Toolbar (4 acciones en modal)
1. **Categorías** — CRUD de categorías (`CategoriesManager` embedded)
2. **Reglas** — reglas de autoasignación por keyword (`RulesPanelContent`)
3. **Revisión** — transacciones con `needs_review = true` de TODOS los meses (`ReviewPanelContent`)
4. **Exportar** — CSV/Excel de las transacciones del mes (`ExportOptions`)

## Flag "Necesita revisión"
- Botón de bandera ámbar en cada `TransactionRow` (hover para ver, siempre visible si activo)
- `toggleNeedsReview(id, value)` en `app/finances/actions.ts`
- El panel Revisión filtra de `allTransactions` (no del mes visible) para no perder nada

## Importación de movimientos
- CSV o Excel (xlsx) arrastrando o desde botón en header
- Reglas de categorización se aplican automáticamente al importar

## Filtro por mes y persistencia
- El mes seleccionado se pasa como query param `?month=YYYY-MM` entre la página principal y el detalle de categoría
- Por defecto se selecciona el **último mes con datos** (`availableMonths[0]`), no el mes calendar anterior
- El enlace "Volver" en `/finances/categoria/[id]` preserva el `?month=` activo
- `CategoryBreakdown` recibe `selectedMonth` como prop y construye los hrefs con el mes incluido

## Gastos Fijos

El modelo de gastos fijos se basa en dos mecanismos complementarios: un **flag por transacción** y una **tabla de patrones** para auto-detección en importaciones futuras.

### Flag `is_fixed` en `bank_transactions`
Columna booleana `is_fixed BOOLEAN NOT NULL DEFAULT false` añadida a la tabla existente. El usuario marca/desmarca una transacción individual desde el botón Bookmark en `TransactionRow` (solo visible en gastos, `importe < 0`).

### Panel `FixedPatternsPanel`
`app/finances/fixed-patterns-panel.tsx` — Client Component renderizado al final de `/finances` (solo en vista por mes, no en "Todos").

Recibe del Server Component:
- `patterns` — lista de `fixed_patterns` (id, pattern, label)
- `totalFixed` — suma de importes de las transacciones con `is_fixed = true` del mes seleccionado
- `fixedTransactions` — detalle de dichas transacciones para mostrar el desglose
- `selectedMonth` / `labelMonth` — mes en vista

Muestra: importe total fijo del mes, desglose por transacción, calculadora de fondo de emergencia (3/6/12 meses), y lista desplegable de patrones activos con botón de eliminar.

### Tabla `fixed_patterns`
```sql
CREATE TABLE fixed_patterns (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern    TEXT NOT NULL,
  label      TEXT,
  UNIQUE(pattern),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: familia_autenticada (FOR ALL TO authenticated USING (true) WITH CHECK (true))
-- GRANT ALL ON fixed_patterns TO anon, authenticated;
```

### Flujo al marcar como fijo (`toggleFixed`)
1. Actualiza `is_fixed = true` en la transacción marcada.
2. Extrae el patrón: `toFixedPattern(concepto_original)` recorta fechas finales del banco tipo `" 31/03/26"` con regex `/\s+\d{2}\/\d{2}\/\d{2,4}\s*$/`.
3. Guarda (upsert por `pattern`) en `fixed_patterns` con `label = concepto` (nombre limpio).
4. Aplica el patrón retroactivamente: `UPDATE bank_transactions SET is_fixed = true WHERE concepto_original ILIKE '<pattern>%' AND importe < 0`.
5. `revalidatePath('/finances')` y `revalidatePath('/')`.

Al desmarcar (`value = false`): solo actualiza la transacción individual. Las demás transacciones marcadas por el mismo patrón conservan `is_fixed = true`.

### Auto-detección al importar (`importTransactions`)
Después de insertar las nuevas transacciones, la action recorre todos los `fixed_patterns` activos y aplica `UPDATE ... ILIKE '<pattern>%'` sobre las filas recién importadas. Este paso también se ejecuta en el fallback de upsert por conflicto 23505.

### Server Actions (`app/finances/actions.ts`)
- `toggleFixed(id, value, conceptoOriginal, concepto)` — marca/desmarca + gestiona patrón, revalida `/finances` y `/`
- `deleteFixedPattern(id)` — elimina el patrón de la tabla (no desmarca transacciones ya marcadas), revalida `/finances` y `/`

### Fondo de emergencia
Calculado en el panel como `totalFixed * N` meses para N = 3, 6 y 12. El colchón de 6 meses aparece destacado.

## Modal
`components/Modal.tsx`:
- Overlay fijo + tarjeta centrada
- `max-h-[85vh]`, scroll interno con `overflow-y-auto flex-1 min-h-0`
- Cierra con Escape o click en overlay
- Tamaños: `sm` (max-w-sm), `md` (max-w-lg), `lg` (max-w-2xl)
