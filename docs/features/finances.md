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

## Modal
`components/Modal.tsx`:
- Overlay fijo + tarjeta centrada
- `max-h-[85vh]`, scroll interno con `overflow-y-auto flex-1 min-h-0`
- Cierra con Escape o click en overlay
- Tamaños: `sm` (max-w-sm), `md` (max-w-lg), `lg` (max-w-2xl)
