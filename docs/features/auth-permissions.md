# Auth & Permisos

## Autenticación
- Supabase Auth (email + password)
- `app/login/page.tsx` — formulario de login
- `app/actions/auth.ts` — server action `signOut` para componentes cliente

## Permisos por usuario
Los permisos se almacenan como array de strings en dos lugares sincronizados:
1. `profiles.permissions` (columna jsonb en Supabase)
2. `user_metadata.permissions` en el JWT de Supabase Auth

### Claves de permiso disponibles
| Clave | Módulo |
|-------|--------|
| `meals` | Comidas |
| `recipes` | Recetas |
| `shopping` | Lista de la compra |
| `finances` | Finanzas |
| `utilities` | Utilidades |
| `services` | Bonos/Servicios |
| `restaurants` | Restaurantes |
| `wishlist` | Lista de deseos |
| `health` | Salud |
| `trips` | Viajes |
| `tasks` | Quests (Tareas del Hogar) |

### Flujo de actualización de permisos
1. Admin edita permisos en `/admin` → `UserRow` chips
2. Click "Guardar permisos" → `updateUserPermissions` en `app/admin/user-actions.ts`
3. Actualiza `profiles` en DB + `user_metadata` en Supabase Auth (para que el JWT se sincronice)

## Protección de rutas
`proxy.ts` en la raíz del proyecto intercepta todas las peticiones:
- Sin sesión → redirect a `/login`
- En `/login` con sesión → redirect a `/`
- Ruta protegida sin permiso → redirect a `/` (inicio)
- `/admin` → solo `ADMIN_EMAIL` (variable de entorno)

Los permisos se leen del JWT (`user.user_metadata?.permissions`) sin hacer DB calls.

```ts
// proxy.ts — PROTECTED_ROUTES
const PROTECTED_ROUTES: Record<string, string> = {
  '/meals': 'meals',
  '/recipes': 'recipes',
  '/shopping-list': 'shopping',
  '/finances': 'finances',
  ...
}
```

## Seguridad de datos — Supabase RLS

`proxy.ts` protege las rutas de Next.js, pero el endpoint REST de Supabase (`https://<proyecto>.supabase.co/rest/v1/<tabla>`) es accesible directamente con la anon key, sin pasar por Next.js. Row Level Security (RLS) es la segunda capa de defensa que protege los datos aunque alguien acceda al endpoint directamente.

**Regla**: toda tabla nueva debe incluir `ENABLE ROW LEVEL SECURITY` + política en la misma migración que la crea.

### Patrón — datos familiares compartidos
Todos los miembros autenticados pueden leer y escribir (finanzas, recetas, restaurantes, planificador, suministros, bonos):

```sql
ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON <tabla>
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
GRANT ALL ON <tabla> TO anon, authenticated;
```

### Patrón — datos personales
Cada usuario solo accede a sus propios registros (salud, wishlist):

```sql
ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solo_propietario" ON <tabla>
  FOR ALL
  USING (auth.uid() = user_id);
GRANT ALL ON <tabla> TO anon, authenticated;
```

### Tablas con RLS activo (referencia)
| Módulo | Tablas |
|--------|--------|
| Finanzas | `bank_transactions`, `category_rules`, `transaction_categories`, `transaction_subcategories` |
| Suministros | `home_invoices` |
| Bonos/Servicios | `service_passes` |
| Recetas | `recipes`, `ingredients`, `recipe_ingredients` |
| Planificador | `weekly_plan` |
| Restaurantes | `restaurants`, `restaurant_lists`, `restaurant_list_items`, `reservations`, `tag_colors` |

## Admin
- Email de admin en `ADMIN_EMAIL` env var (o hardcoded en proxy.ts)
- Panel admin en `/admin` con gestión de usuarios: crear, eliminar, asignar permisos
- `createUser` da todos los permisos por defecto al crear
