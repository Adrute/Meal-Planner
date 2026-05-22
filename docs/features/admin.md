# Panel de Administración

## Rutas
- `/admin` — panel principal
- `/admin/db` — explorador de base de datos

## Acceso
Solo accesible para el email definido como `ADMIN_EMAIL` (hardcoded como `claudrian1992@gmail.com` en `app/admin/page.tsx` y `app/admin/user-actions.ts`). El middleware `proxy.ts` redirige a `/` si el usuario no es admin.

## Secciones del panel principal (`/admin`)

### Gestión de usuarios
Componente `UserManager` (`app/admin/user-manager.tsx`):
- Lista todos los perfiles de `profiles` con email, display_name y permisos actuales
- Crear usuario: email, contraseña, nombre — da todos los permisos por defecto
- Editar nombre de usuario
- Asignar/quitar permisos con chips clicables
- Eliminar usuario

### Limpieza de agenda
- Muestra el recuento de planes de `weekly_plan` con `day_date < hoy`
- Botón `DeletePlansButton` que llama a `deletePastPlans()`

### Estadísticas de BD
- Total de recetas (`recipes`)
- Total de ingredientes (`ingredients`)

### Gestión de contenido — recetas
Tabla con todas las recetas (nombre, id) y botón de borrado individual (`DeleteRecipeButton`).

### Explorador de base de datos (enlace)
Link a `/admin/db`.

## Explorador de base de datos (`/admin/db`)

### Acceso
Misma validación de admin que el panel principal. Usa el **service role key** para saltar RLS y ver todos los datos.

### Tablas disponibles
Definidas en el array `TABLES` de `app/admin/db/page.tsx`:

| tabla | módulo |
|---|---|
| `profiles` | Auth |
| `recipes`, `ingredients`, `weekly_plan`, `school_menu_items` | Comidas |
| `bank_transactions`, `transaction_categories`, `transaction_subcategories`, `category_rules` | Finanzas |
| `home_invoices` | Suministros |
| `service_passes` | Bonos |
| `restaurants`, `reservations` | Restaurantes |
| `wishlist_items` | Wishlist |
| `weight_logs`, `running_logs`, `hydration_logs` | Salud |
| `trips`, `trip_transport`, `trip_accommodations`, `trip_activities`, `trip_pois`, `trip_expenses`, `trip_checklist` | Viajes |

### Funcionalidades
- Paginación de 50 filas por página (`PAGE_SIZE = 50`)
- Selección de tabla vía `?table=nombre_tabla`
- Componente `TableExplorer` renderiza las filas en tabla HTML
- Permite editar celdas individuales y eliminar filas (implementado en `app/admin/db/actions.ts`)

## Server Actions

### `app/admin/actions.ts`
- `deletePastPlans()` — elimina `weekly_plan` con `day_date < hoy`
- `deleteRecipe(id)` — elimina una receta

### `app/admin/user-actions.ts`
Todas las acciones verifican que el usuario sea admin con `assertAdmin()` antes de ejecutarse. Usan el **service role client** para operaciones administrativas en Supabase Auth.

| acción | descripción |
|---|---|
| `createUser` | Crea usuario en Supabase Auth con `email_confirm: true` + inserta en `profiles` con todos los permisos |
| `deleteUser` | Elimina usuario de Supabase Auth |
| `updateUserDisplayName` | Actualiza `display_name` en `profiles` |
| `updateUserPermissions` | Actualiza `profiles.permissions` + sincroniza `user_metadata.permissions` en el JWT |

## Por qué se sincronizan dos sitios en `updateUserPermissions`
Los permisos deben estar en `profiles` (para persistencia) y en `user_metadata` del JWT (para que `proxy.ts` pueda leerlos sin hacer una DB call en cada request).
