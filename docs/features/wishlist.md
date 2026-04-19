# Lista de Deseos

## Archivos
- `app/wishlist/page.tsx` — Server Component, carga datos
- `app/wishlist/wishlist-ui.tsx` — Client Component principal
- `app/wishlist/actions.ts` — Server Actions (todas vía RPCs de Supabase)

## Modelo de datos — `wish_items`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | Propietario |
| `name` | text | Nombre del elemento |
| `description` | text\|null | Descripción / detalles |
| `type` | text | `objeto`, `evento`, `experiencia` |
| `url` | text\|null | Enlace de referencia |
| `price_estimate` | numeric\|null | Precio estimado en € |
| `priority` | text | `alta`, `media`, `baja` |
| `is_shareable` | bool | Si aparece en la lista de WhatsApp |
| `is_purchased` | bool | Si ya se ha conseguido |

## RPCs de Supabase
Todas las operaciones pasan por funciones `SECURITY DEFINER`:
- `get_my_wishlist_items()` — items del usuario actual
- `get_item_shares(p_user_id)` — mapa item → usuarios con acceso
- `get_items_shared_with_me()` — items de otros compartidos con el usuario
- `create_wish_item(...)`, `update_wish_item(...)`, `delete_wish_item(p_id)`
- `toggle_wish_field(p_id, p_field, p_value)` — actualiza `is_shareable` o `is_purchased`
- `share_wish_item(p_item_id, p_user_id)`, `unshare_wish_item(...)` — gestiona sharing entre usuarios

## Funcionalidades

### Mis elementos
- CRUD completo: crear, editar, eliminar
- Filtros por tipo (objeto/evento/experiencia) y botón para mostrar/ocultar conseguidos
- Ordenación automática por prioridad: alta → media → baja
- Barra de color en la tarjeta según prioridad (rojo/ámbar/gris)

### Compartir con familia (in-app)
- `UserSharePicker` — dropdown con todos los usuarios de la app
- Toggle por usuario: llama a `shareWithUser` / `unshareWithUser`
- Items compartidos conmigo aparecen en sección "Compartido conmigo" (solo lectura)

### Compartir por WhatsApp
- Toggle `is_shareable` en cada item para incluirlo/excluirlo
- `SharePanel` genera texto formateado con emoji por tipo, nombre, precio y url
- Botón "WhatsApp" abre `wa.me` con el texto; botón "Copiar" copia al portapapeles
- Solo incluye items `is_shareable = true` y `is_purchased = false`

## Componentes UI
| Componente | Descripción |
|-----------|-------------|
| `WishCard` | Tarjeta de item propio con edición inline |
| `SharedItemCard` | Tarjeta de item ajeno (solo lectura) |
| `ItemForm` | Formulario de creación/edición |
| `UserSharePicker` | Dropdown para compartir con usuarios de la app |
| `SharePanel` | Dropdown para generar texto WhatsApp |
