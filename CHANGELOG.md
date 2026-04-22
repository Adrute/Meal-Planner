# Changelog — FamilyTools

## [2026-04-23] Dashboard: rediseño de widgets
- Widget Menú ocupa el ancho completo y muestra hoy + próximos 3 días (Cole / Almuerzo / Cena por día)
- Widget Próximos Planes dividido en dos columnas: reservas de restaurantes y viajes
- Columna de viajes muestra el próximo viaje destacado + contadores por estado (Deseos / Planificando / Confirmados)

## [2026-04-23] Módulo Viajes
- Nueva sección `/trips` con permiso `trips`
- Listado de viajes con filtros por estado (wishlist / planning / confirmed / completed)
- Detalle de viaje con 7 pestañas: Resumen, Transporte, Alojamiento, Itinerario, Lugares, Gastos, Checklist
- Búsqueda de puntos de interés vía Nominatim OSM con mapa Leaflet (react-leaflet v5)
- Registro de gastos con resumen por categoría y barra de presupuesto
- Checklist de preparación con categorías, barra de progreso y prefill de items comunes
- Permiso `trips` añadido al panel de administración de usuarios
- Enlace "Viajes" con icono Plane añadido al menú lateral

## [2026-04-23] Finanzas: filtro de mes persistente
- El filtro por mes se mantiene al navegar a categorías y al volver
- Por defecto se selecciona el último mes con datos registrados, no el mes anterior del calendario

## [2026-04-21] Salud: botón maximizar paneles
- Cada panel (Peso, Hidratación, Running) tiene un botón ↗ para expandirlo a pantalla completa
- La vista maximizada centra el contenido en un overlay sobre fondo gris
- La X cierra de vuelta a la vista en grid

## [2026-04-21] Salud: mejoras running y historial de peso
- Running: input de duración cambiado a min:seg (guardado como minutos decimales)
- Running: desglose de KM por mes con barras de progreso
- Running: gráfica muestra solo evolución del ritmo con línea de media
- Peso: historial muestra diferencia vs registro anterior (+/- kg con icono y color)
- Peso: historial con scroll limitado (max-h-60)
- Requiere migración SQL: `ALTER TABLE running_logs ALTER COLUMN duration_minutes TYPE numeric(8,4);`

## [2026-04-21] Salud: hidratación y mejoras de UI
- Nueva sección de hidratación: contador de vasos +/-, barra de progreso, objetivo de 8 vasos, historial
- Gráfica de líneas para hidratación (sky blue) con línea de referencia del objetivo
- Permiso `health` añadido al panel de administración de usuarios
- Enlace "Salud" con icono HeartPulse añadido al menú lateral
- Botones de submit visibles desde el inicio (formularios movidos antes de las gráficas)
- Gráfica de distancia en running convertida a línea
- SQL requerido: tabla `hydration_logs` con RLS (ver docs)

## [2026-04-21] Módulo Salud
- Nueva sección `/health` con permiso `health`
- Seguimiento de peso: registro diario, gráfica de evolución, stats (actual/inicio/diferencia)
- Seguimiento de running: distancia, duración, ritmo (min/km), sensación, notas
- Gráfica de barras por distancia y línea de evolución del ritmo
- Datos privados por usuario con RLS en Supabase

## [2026-04-21] Mejoras planificador IA
- Prompt mejorado: la IA analiza día a día el menú escolar y evita repetir grupos de alimentos (tortilla = huevos, etc.)
- Restricciones separadas por prioridad: alergia (nunca) > intolerancia (evitar) > preferencia
- Modal "Por qué esta cena" con header violeta al pulsar ℹ️ en cenas generadas por IA
- `ai_notes` guardado en `weekly_plan` para persistir la explicación

## [2026-04-21] Gestión de recetas mejorada
- Edición de recetas existentes (`/recipes/[id]/edit`)
- Agrupación por categoría en el listado con emoji por tipo (🍝🥩🐟…)
- Favoritas: toggle estrella en tarjeta y detalle, filtro "Solo favoritas"
- Filtros por categoría con tabs en el listado
- Unidad de medida por ingrediente (g, kg, ml, tazas, cdas…)
- Errores de validación con banners descriptivos y campos resaltados en rojo
- Botón de borrar receta con confirmación
- Nuevas columnas en `recipes`: `is_favorite`, `category`, `prep_time`

## [2026-04-21] Dashboard reestructurado + Menú de Hoy mejorado
- Widget "Menú de Hoy" muestra datos reales: menú escolar (Cole), almuerzo y cena del planificador
- Se muestra el día y fecha actual en el widget
- "Próximas Visitas" renombrado a "Próximos Planes"
- Nuevo layout en dos filas: Menú+Planes arriba, Finanzas+Suministros debajo

## [2026-04-21] Planificador de comidas con IA
- Importación de menú escolar mensual vía PDF (drag & drop) con extracción IA (Groq Llama 3.3)
- El PDF guarda el mes completo; el planificador filtra la semana actual automáticamente
- Generación de cenas complementarias con IA por semana (botón por WeekBlock)
- La IA complementa el menú escolar (evita repetir proteína/legumbres) y respeta restricciones
- Gestión de miembros del hogar con restricciones alimentarias (alergias, intolerancias, preferencias)
- Muestra el menú del colegio dentro de cada día del planificador (badge "Cole")
- Nuevas tablas Supabase: `household_members`, `school_menu_items`
- Integración gratuita: Groq API (tier gratuito, sin tarjeta de crédito)

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
