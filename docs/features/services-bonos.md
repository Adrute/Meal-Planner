# Servicios & Bonos

## Página
`app/services/page.tsx` — Server Component. Server Actions en `app/services/actions.ts`.

## Modelo de datos — `service_passes`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | PK |
| `service_name` | text | Nombre del servicio |
| `total_sessions` | int | Sesiones totales del bono |
| `used_sessions` | int | Sesiones consumidas |
| `amount_paid` | numeric | Importe pagado |
| `last_payment_date` | date | Fecha del último pago |
| `session_dates` | text[] | Historial de fechas de sesiones consumidas |

## Server Actions (`app/services/actions.ts`)
Hasta 2026-07-13 estaban duplicadas entre `app/page.tsx` (dashboard) y `app/services/page.tsx`, con el riesgo de que un cambio de lógica se aplicara en un sitio y se olvidara en el otro (ver "Lessons Learned" en `CLAUDE.md`). Se consolidaron en `app/services/actions.ts`, y tanto la página de bonos como la home importan desde ahí. La home (`/`) ya no gestiona bonos directamente: en su lugar muestra un aviso por bono agotado que enlaza a `/services` (ver [dashboard.md](./dashboard.md)).

### `addService`
Crea un nuevo bono con `used_sessions = 0` y `session_dates = []`.

### `consumeSession`
1. Lee el bono actual (necesita `total_sessions`, `service_name`, `amount_paid`)
2. Añade `consume_date` al array `session_dates`
3. Incrementa `used_sessions`
4. Si `newUsed >= total_sessions` → envía email de bono agotado

### `renewService`
Resetea `used_sessions = 0` y `session_dates = []`, actualiza `last_payment_date`.

### `deleteService`
Elimina el registro completo.

## Notificación email
Ver [email-notifications.md](./email-notifications.md)

Un bono solo puede consumirse desde `/services` (`consumeSession` en `app/services/actions.ts`), que llama a `sendBonoAgotadoEmail` cuando se agota.

## UI
- Barra de progreso visual (verde → rojo al agotarse)
- Historial de fechas como chips
- Formulario inline de consumo/renovación con selector de fecha
- Botón eliminar visible en hover
