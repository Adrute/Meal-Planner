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

## Admin
- Email de admin en `ADMIN_EMAIL` env var (o hardcoded en proxy.ts)
- Panel admin en `/admin` con gestión de usuarios: crear, eliminar, asignar permisos
- `createUser` da todos los permisos por defecto al crear
