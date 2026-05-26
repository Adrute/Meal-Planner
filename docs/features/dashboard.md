# Dashboard (Inicio)

## Ruta
`/` — página principal de la app

## Archivo
`app/page.tsx` — Server Component con Server Actions inline para los bonos

## Widgets

### Widget 1 — Menú (ancho completo)
- Muestra hoy + próximos 3 días en grid de 4 columnas (2 en móvil)
- Por cada día: menú del cole (si existe en `school_menu_items`), almuerzo y cena del planificador
- Icono de cesta con enlace directo a `/shopping-list`
- Enlace → `/meals`

**Datos cargados:**
```ts
weekly_plan.select('meal_type, day_date, recipes(name)').in('day_date', menuDates)
school_menu_items.select('date, first_course, second_course, dessert').in('date', menuDates)
```

### Widget 2 — Próximos planes
`UpcomingReservationsWidget` (componente async en `components/UpcomingReservationsWidget.tsx`):
- Próximas reservas de restaurantes (con fecha, hora y nombre del local)
- Próximo viaje: tarjeta con destino y fechas + contadores de viajes por estado (Deseos / Planificando / Confirmados)

### Widget 3 — Quests esta semana
`TasksWidget` (función async inline en `app/page.tsx`):
- Cabecera con icono Swords y título "Quests esta semana"
- Solo muestra quests `daily` y `weekly`
- Barra de progreso, contador completadas/pendientes
- Chips de las misiones pendientes (máx. 6 + contador de restantes)
- Mensaje vacío: "Sin misiones registradas"
- Si todo completado: mensaje de celebración

**Datos cargados:**
```ts
household_tasks.select('id, title, frequency, day_of_week, assigned_to')
task_completions.select('task_id, completed_date').gte(monStr).lte(sunStr)
```

### Widget 4 — Finanzas
`FinancesWidget` (función async inline en `app/page.tsx`):
- Gasto total del mes actual (suma de transacciones negativas)
- Porcentaje de variación vs mes anterior (verde si baja, rojo si sube)
- Top 3 categorías del mes anterior por importe
- Si no hay datos: placeholder con enlace a importar
- Enlace → `/finances`

**Datos cargados:**
```ts
bank_transactions.select('importe, categoria').gte(currentMonth-01)  // mes actual
bank_transactions.select('importe, categoria').gte/lt(prevMonth)      // mes anterior
```

### Widget 5 — Suministros
- Medias de luz/gas/servicios por mes (calculadas sobre todas las facturas)
- Alerta automática de tarifa: si `elec_amount / elec_kwh > 0.16 €/kWh` → aviso de tarifa cara; si no → confirmación de tarifa optimizada
- Si no hay datos: enlace a importar primera factura
- Enlace → `/utilities`

**Datos cargados:**
```ts
home_invoices.select('*').order('issue_date', { ascending: false })
```

### Sección Bonos (solo si hay bonos activos)
Muestra todos los bonos de `service_passes` en grid de 2 columnas. Para cada bono:
- Nombre, fecha/importe de último pago
- Barra de progreso verde → roja al agotarse
- Historial de fechas de sesiones consumidas
- Form de "Consumir sesión" (con selector de fecha) si quedan sesiones
- Form de "Nuevo Pago" si está agotado
- Botón eliminar (visible en hover)

Las Server Actions `consumeSession`, `renewService` y `deleteService` están definidas **directamente en `app/page.tsx`** como funciones async marcadas con `'use server'` (duplicadas respecto a `app/services/page.tsx` — misma lógica).

## Lógica de cálculo del widget de suministros

Media ponderada por período de facturación (no media simple). Se usa porque TotalEnergies factura con periodicidad variable:

```ts
const totalMonths = invoices.reduce((s, inv) => s + (inv.billing_period_months ?? 2), 0)
avgElec = invoices.reduce((s, inv) => s + Number(inv.elec_amount), 0) / totalMonths
avgGas  = invoices.reduce((s, inv) => s + Number(inv.gas_amount),  0) / totalMonths
avgServ = invoices.reduce((s, inv) => s + Number(inv.services_amount), 0) / totalMonths
```

`billing_period_months` se extrae del PDF al importar (regex sobre rango de fechas de facturación). Fallback: `2` (bimestral).

## Análisis automático de tarifa eléctrica
```ts
pricePerKwh = latestInvoice.elec_amount / latestInvoice.elec_kwh
MARKET_THRESHOLD = 0.16  // €/kWh
```
Si supera el umbral → alerta amarilla. Si está por debajo → confirmación verde.
