# Dashboard (Inicio)

## Ruta
`/` — página principal de la app

## Archivo
`app/page.tsx` — Server Component. Desde el rediseño de 2026-07-13 funciona como centro de mando + launcher, no como panel de widgets por módulo.

## Estructura de la página

1. Cabecera de saludo
2. **Quests** (ancho completo) — igual que antes del rediseño
3. **Avisos** — franja de tarjetas accionables, solo si hay algún aviso activo
4. **Launcher** — grid de accesos directos a los 12 módulos de la app

Los widgets de Finanzas, Bonos (con sus formularios de consumo/renovación), Menú de 4 días y Próximos planes (`UpcomingReservationsWidget`) se eliminaron de la home en este rediseño. Esa información sigue disponible en sus páginas de módulo (`/finances`, `/services`, `/meals`, `/restaurants/reservations`, `/trips`); lo que antes eran widgets ahora se resume, cuando aplica, como aviso accionable.

## Widget — Quests (ancho completo)
Sin cambios respecto a antes del rediseño. `TasksWidget` (función async inline en `app/page.tsx`) → renderiza `QuestsWidgetClient` (componente cliente en `app/tasks/QuestsWidgetClient.tsx`). Ver detalle completo en [quests.md](./quests.md#widget-en-el-dashboard).

**Datos cargados:**
```ts
household_tasks.select('id, title, frequency, day_of_week, assigned_to, custom_interval_days').order(...)
task_completions.select('task_id, completed_date, completed_by').gte('YYYY-01-01').lte('YYYY-12-31')
profiles.select('id, display_name, email')
```

## Avisos (`getDashboardAlerts`)
Lógica en `lib/dashboard-alerts.ts`, invocada desde `HomeDashboard`. Devuelve un array de `DashboardAlert` (`{ type: 'warning', title, message, href }`) que se renderiza como tarjetas ámbar con enlace directo al módulo correspondiente. Si el array está vacío, la sección no se muestra.

No hay gating por permisos: los avisos se muestran a cualquier usuario autenticado, igual que el resto de la home.

### Tipos de aviso

**Bono agotado** — uno por cada bono de `service_passes` con `used_sessions >= total_sessions` (sin agrupar, un aviso por bono). Enlaza a `/services`.

**Factura de luz cara** — a partir de la última factura de `home_invoices` (por `issue_date` descendente): si `elec_amount / elec_kwh > 0.16 €/kWh` genera un aviso. Enlaza a `/utilities`. A diferencia del antiguo widget de Suministros, no hay confirmación visual cuando la tarifa está bien (ya no se anuncia lo que va bien, solo lo accionable).

**Viaje en 48h** — viajes de `trips` con `start_date` estrictamente mayor que hoy y menor o igual que hoy+48h (el viaje aún no ha empezado). Enlaza a `/trips`.

**Datos cargados:**
```ts
service_passes.select('id, service_name, used_sessions, total_sessions')
home_invoices.select('elec_amount, elec_kwh, issue_date').order('issue_date', desc).limit(1)
trips.select('id, title, destination, start_date').gt('start_date', today).lte('start_date', in48h)
```

> Nota de zona horaria: `today`/`in48h` en `lib/dashboard-alerts.ts` se calculan con `new Date().toISOString().split('T')[0]` (UTC), no con el helper `madridDate` (`toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })`) que usa el resto de la app (ver [quests.md](./quests.md#zona-horaria-madrid)). Esto puede desplazar el aviso de "viaje en 48h" en la ventana horaria en la que UTC y Madrid caen en fechas distintas (aprox. 22:00–24:00 UTC). Pendiente de alinear con el resto de la app.

## Launcher (`LAUNCHER_ITEMS`)
Grid de 12 accesos directos (3 columnas en móvil, 4 en tablet, 6 en desktop), cada uno con icono, color y enlace al módulo: Comidas, Finanzas, Recetas, Suministros, Bonos, Compra, Restaurantes, Viajes, Salud, Deseos, Ingredientes, Quests.

Sin gating por permisos (decisión de producto): todos los tiles se muestran a cualquier usuario autenticado, independientemente de sus permisos en `user_metadata.permissions`. El tile de Ingredientes no tiene permission key propia — la ruta `/ingredients` no está en `PROTECTED_ROUTES` de `proxy.ts` (situación preexistente, no introducida por este rediseño).
