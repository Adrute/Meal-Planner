# Servicios & Bonos

## Página
`app/services/page.tsx` — Server Component con Server Actions

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

## Server Actions

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

El mismo bono puede agotarse desde dos sitios:
- `/services` — `consumeSession` en `app/services/page.tsx`
- Dashboard `/` — `consumeSession` en `app/page.tsx`

Ambas funciones son idénticas y llaman a `sendBonoAgotadoEmail`.

## UI
- Barra de progreso visual (verde → rojo al agotarse)
- Historial de fechas como chips
- Formulario inline de consumo/renovación con selector de fecha
- Botón eliminar visible en hover
