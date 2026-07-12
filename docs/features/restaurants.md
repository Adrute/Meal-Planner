# Restaurantes

## Rutas
- `/restaurants` — mapa interactivo con todos los locales
- `/restaurants/[id]` — ficha detallada del local
- `/restaurants/[id]/edit` — edición del local
- `/restaurants/reservations` — listado de próximas reservas
- `/restaurants/table` — directorio de locales en tabla

## Permiso necesario
El usuario debe tener `"restaurants"` en `user_metadata.permissions`.

## Modelo de datos

### `restaurants`
| campo | tipo | notas |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | nombre del local |
| `lat` / `lng` | numeric | coordenadas para el mapa |
| `status` | text | `pending` / `liked` / `doubtful` / `rejected` |
| `comments` | text\|null | notas libres |
| `allergens` | text[] | array de etiquetas personalizadas (no solo alérgenos) |
| `is_favorite` | bool | favorito (pin amarillo en el mapa) |
| `food_type` | text\|null | tipo de cocina |
| `website` | text\|null | URL del sitio web |

Estados antiguos (`visited`, `approved`) se traducen automáticamente a `liked` al cargar.

### `reservations`
| campo | tipo | notas |
|---|---|---|
| `id` | uuid | PK |
| `restaurant_id` | uuid | FK restaurants |
| `reservation_date` | timestamptz | fecha y hora de la reserva |

Las reservas pasadas se eliminan automáticamente al cargar la página principal (`/restaurants`).

### `restaurant_lists`
Listas personalizadas de restaurantes (ej: "Terrazas de verano", "Para cumpleaños").
| campo | tipo |
|---|---|
| `id` | uuid |
| `name` | text |

### `restaurant_list_items`
Tabla de unión entre `restaurants` y `restaurant_lists`.
| campo | tipo |
|---|---|
| `restaurant_id` | uuid |
| `list_id` | uuid |

### `tag_colors`
Colores personalizados por etiqueta.
| campo | tipo |
|---|---|
| `tag` | text |
| `color` | text | clase Tailwind (bg + text + border) |

## Página principal — Mapa (`/restaurants`)

### Datos cargados
- Todos los restaurantes con sus reservas anidadas (`restaurants.select('*, reservations(*)')`)
- Todas las listas y sus items
- Colores de etiquetas

### Componentes
| componente | descripción |
|---|---|
| `MapWrapper` | Carga `MapComponent` con `dynamic(..., { ssr: false })` para evitar error SSR de Leaflet |
| `MapComponent` | Mapa Leaflet (CartoDB Voyager) con marcadores por estado. Popup con info del local |
| `ActionMenu` | FAB flotante en la esquina inferior derecha. Se expande con opciones |

### FAB (`ActionMenu`) — acciones disponibles
- **Añadir local** → abre `AddRestaurantModal` (nombre, coordenadas, estado, etiquetas, tipo)
- **Ver listas** → abre `ListBrowserModal` (explorar y gestionar listas)
- **Gestionar etiquetas** → abre `TagManagerModal` (asignar colores a cada etiqueta)
- **Tabla de locales** → navega a `/restaurants/table`
- **Ver reservas** → navega a `/restaurants/reservations`

### Marcadores del mapa
| color | condición |
|---|---|
| Amarillo (`#fbbf24`) | `is_favorite = true` |
| Verde (`#34d399`) | `status = liked` |
| Azul (`#60a5fa`) | `status = pending` |
| Violeta (`#a78bfa`) | `status = doubtful` |
| Rosa (`#fb7185`) | `status = rejected` |

### Popup del mapa
- Nombre, estado, tipo de cocina, etiquetas con colores
- Próxima reserva si existe (con contador de reservas adicionales)
- Opciones de navegación: Google Maps, Apple Maps, Waze
- Botón de web oficial (si tiene)
- Enlace a la ficha del local

## Ficha del local (`/restaurants/[id]`)

### Datos cargados
- Datos del restaurante
- Sus reservas
- Todas las listas (para el `ListManager`)
- Los colores de etiquetas

### Secciones
- Información: nombre, estado, tipo, etiquetas con colores
- Ubicación: enlace a Apple Maps
- Web oficial (si existe)
- Notas / comentarios
- `ReservationManager` — CRUD de reservas del local
- `ListManager` — toggle de pertenencia a cada lista

## Directorio de locales (`/restaurants/table`)
Vista tabular de todos los locales con ordenación y filtros. Alternativa al mapa para búsquedas rápidas.

## Reservas (`/restaurants/reservations`)
Lista cronológica de todas las reservas futuras, con datos del restaurante asociado. Permite editar la fecha o cancelar desde aquí.

## Server Actions (`actions.ts`)
| acción | descripción |
|---|---|
| `addRestaurant` | Inserta nuevo restaurante |
| `updateRestaurant` | Actualiza campos del restaurante |
| `deleteRestaurant` | Elimina el restaurante (form action con `FormData`) |
| `addReservation` | Crea reserva |
| `cancelReservation` | Elimina reserva |
| `updateReservationDate` | Cambia la fecha de una reserva |
| `createList` | Crea nueva lista |
| `deleteList` | Elimina una lista |
| `toggleList` | Añade o elimina un restaurante de una lista |
| `updateTagColor` | Upsert en `tag_colors` para el color de una etiqueta |

## Dashboard
Desde el rediseño de la home de 2026-07-13 (ver [dashboard.md](./dashboard.md)) ya no existe un widget de próximas reservas en `/`. El componente `UpcomingReservationsWidget` se eliminó por quedar huérfano. Las reservas próximas se consultan en `/restaurants/reservations`.
