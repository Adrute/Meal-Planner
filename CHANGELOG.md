# Changelog — MiHogar

## [2026-04-19] Optimización del flujo de trabajo
- Creado `CLAUDE.md` con instrucciones de trabajo para Claude Code
- Creado `CHANGELOG.md` (este fichero)
- Creada carpeta `docs/features/` con documentación de cada módulo
- Establecido flujo Git: rama → trabajo → merge main → push

## [2026-04-19] Notificación email al agotar bonos (Dashboard)
- Corregido: el dashboard (`app/page.tsx`) no enviaba email al consumir última sesión
- Ahora `consumeSession` en dashboard es idéntica a la de `/services` e incluye `sendBonoAgotadoEmail`

## [2026-04-18] Notificación email al agotar bonos
- Nueva función `sendBonoAgotadoEmail` en `lib/email.ts` usando Resend
- Se dispara en `consumeSession` de `app/services/page.tsx` cuando `newUsed >= total_sessions`
- Resend inicializado de forma lazy (dentro de la función) para evitar errores en build
- `NOTIFY_EMAIL` env var con fallback a `claudrian1992@gmail.com`

## [2026-04-18] Cálculo neto de gastos en finanzas
- Los ingresos en categorías no-income se tratan como reembolsos
- Helper `netCat()` calcula: gastos brutos - reembolsos por categoría
- Evita falsear el gasto real cuando se comparte una compra

## [2026-04-18] Reorganización UI de finanzas
- 4 botones de acción en toolbar: Categorías, Reglas, Revisión, Exportar (abren modal)
- Import + Eliminar movidos a la cabecera de la página (`FinancesHeader`)
- `Modal.tsx` nuevo componente con soporte de tamaños sm/md/lg y scroll interno
- `CategoriesManager` recibe prop `embedded` para renderizar sin wrapper colapsable

## [2026-04-18] Flag "Necesita revisión" en transacciones
- Campo `needs_review` en tabla `transactions` (boolean)
- Botón de bandera ámbar en cada fila (visible en hover, siempre si está activo)
- Panel "Revisión" muestra todas las transacciones pendientes de revisión
- `toggleNeedsReview` server action en `app/finances/actions.ts`

## [2026-04-17] Protección de rutas por permisos
- `proxy.ts` (en lugar de `middleware.ts`) protege rutas según permisos del usuario
- Permisos almacenados en `user_metadata.permissions` (JWT, sin DB call)
- `PROTECTED_ROUTES` mapea prefijos de URL a claves de permiso
- `/admin` restringido al email de administrador

## [2026-04-17] Loading spinners por página
- `PageLoading.tsx` componente skeleton con animación pulse
- Archivos `loading.tsx` creados en todas las secciones de la app

## [2026-04-17] Sidebar móvil deslizante + header móvil
- `AppNavigation.tsx` unifica sidebar desktop y móvil en un solo componente cliente
- Sidebar móvil desliza desde la izquierda con overlay
- Header móvil fijo (h-14) para evitar solapamiento del hamburguesa con el contenido

## [2026-04-17] Nombre de usuario en sidebar
- `get_my_profile()` RPC devuelve nombre y permisos
- Nombre mostrado en el footer del sidebar (desktop y móvil)

## [2026-04-17] Permisos por usuario en panel admin
- 8 chips de permisos por usuario: meals, recipes, shopping, finances, utilities, services, restaurants, wishlist
- `updateUserPermissions` sincroniza permisos en tabla `profiles` y en JWT `user_metadata`
