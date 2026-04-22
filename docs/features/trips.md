# Viajes

## Rutas
- `/trips` — listado de viajes
- `/trips/[id]` — detalle de un viaje (7 pestañas)

## Permisos
Requiere permiso `trips` en `user_metadata.permissions`.

## Modelo de datos

### `trips`
| campo | tipo | notas |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK auth.users |
| `title` | text | nombre del viaje |
| `destination` | text | ciudad/lugar destino |
| `country` | text | país (opcional) |
| `start_date` | date | |
| `end_date` | date | |
| `status` | text | `wishlist` / `planning` / `confirmed` / `completed` |
| `cover_emoji` | text | emoji decorativo |
| `notes` | text | notas libres |
| `budget_total` | numeric | presupuesto total en € |

### `trip_transport`
Segmentos de transporte (vuelo, tren, bus, coche, ferry, otro).
Campos: `type`, `origin`, `destination`, `departure_at`, `arrival_at`, `company`, `booking_ref`, `price`, `notes`.

### `trip_accommodations`
Alojamientos del viaje.
Campos: `name`, `address`, `check_in`, `check_out`, `price_per_night`, `booking_ref`, `notes`.
Noches calculadas en cliente: `(check_out - check_in) / 86400000`.

### `trip_activities`
Actividades del itinerario, agrupadas por fecha.
Campos: `title`, `date`, `time`, `location`, `price`, `confirmed` (bool), `notes`.

### `trip_pois`
Puntos de interés buscados vía Nominatim OSM.
Campos: `name`, `lat`, `lon`, `osm_id`, `category`, `address`, `visited` (bool), `notes`.

### `trip_expenses`
Gastos registrados durante el viaje.
Campos: `description`, `amount`, `category`, `date`, `notes`.
Categorías: comida / transporte / alojamiento / actividades / compras / salud / otro.

### `trip_checklist`
Items de la checklist de preparación.
Campos: `item`, `category`, `checked` (bool).
Categorías: documentos / ropa / higiene / tecnología / salud / accesorios / otro.

## RLS
Todas las tablas tienen `auth.uid() = user_id` (trips) o `EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND user_id = auth.uid())` para las tablas hijas.

## Pestañas del detalle (`/trips/[id]`)

| pestaña | componente | descripción |
|---|---|---|
| Resumen | `ResumenTab` | edición del viaje, resumen de costes, botón eliminar |
| Transporte | `TransporteTab` | segmentos con tipo, origen, destino, fechas, precio |
| Alojamiento | `AlojamientoTab` | estancias con noches calculadas y precio total |
| Itinerario | `ItinerarioTab` | actividades agrupadas por día, toggle confirmado |
| Lugares | `LugaresTab` | búsqueda OSM global + mapa Leaflet, toggle visitado |
| Gastos | `GastosTab` | registro de gastos con resumen y barra de presupuesto |
| Checklist | `ChecklistTab` | lista de preparación por categorías, barra de progreso, prefill automático |

## Mapa de lugares (Leaflet)
- Componente `TripPoisMap` cargado con `dynamic(..., { ssr: false })` para evitar error SSR
- Tiles: CartoDB Voyager
- Pin verde para visitados, índigo para pendientes
- `FitBounds` ajusta el zoom automáticamente al conjunto de puntos

## Búsqueda OSM
- API: `https://nominatim.openstreetmap.org/search` con `format=json&extratags=1&limit=6`
- Sin `viewbox` ni `countrycodes` — búsqueda global
- Header `Accept-Language: es`

## Acciones (`app/trips/actions.ts`)
Server Actions para todas las operaciones CRUD de trips y entidades hijas.
`createTrip` hace `redirect(/trips/${id})` tras el insert.
`prefillChecklist` inserta 16 items comunes agrupados por categoría.

## Dashboard widget
En `components/UpcomingReservationsWidget.tsx`:
- Muestra el próximo viaje más cercano (cualquier estado excepto `completed`, `end_date >= hoy`)
- Bajo la tarjeta, contadores de viajes por estado (Deseos / Planificando / Confirmados)
