# Changelog — FamilyTools

## [2026-07-05] Planificador + Recetas: enlace por nombre e importación mejorada
- `assignMealByName` busca ahora la receta existente por nombre (ILIKE) antes de crear una nueva, enlazando correctamente el slot del plan con la receta del recetario si el nombre coincide
- Nueva action `deleteEmptyRecipes` + componente `EmptyRecipesPanel`: panel colapsable en el recetario que lista las recetas sin ingredientes con checkboxes; permite seleccionar y eliminar las no deseadas en un solo clic

## [2026-07-05] Recetas: exportar recetario a Markdown
- Nuevo botón "Exportar" en la cabecera del recetario
- Descarga un `.md` (`recetas-YYYY-MM-DD.md`) con todas las recetas que tienen ingredientes registrados
- Excluye recetas sin ingredientes; incluye nombre, categoría, tiempo, favorita, ingredientes y pasos
- Implementado como `GET /api/recipes/export`, sin estado en cliente

## [2026-07-05] Planificador: importar menú generado por IA (semana suelta o mes completo)
- Nuevo botón "Importar menú IA" (violeta) en la cabecera del planificador
- Panel con textarea donde pegar el JSON producido por Gemini (u otra IA)
- Formato: array con objetos `{"fecha": "YYYY-MM-DD", "almuerzo": "...", "cena": "..."}`; funciona para cualquier rango de días
- Al importar un mes completo las semanas aparecen automáticamente en el planificador
- Sobreescribe slots existentes; convive sin cambios con el flujo de PDF escolar y con "Generar Cenas IA" de Groq

## [2026-06-13] Quests: misiones épicas avanzan día a día si quedan vencidas
- `getCustomDayForWeek` (`app/tasks/TasksClient.tsx`) ya no fija la misión retrasada en su día de vencimiento original cuando ese día queda dentro de la semana actual; ahora se reubica en el día de hoy mientras no se complete, avanzando con cada día que pasa
- Al completarla, `getNextDueDate` sigue calculando la próxima fecha desde la fecha real de completado, por lo que la periodicidad reinicia desde ese momento

## [2026-06-02] Finanzas: refactor gastos fijos — flag en transacciones + patrones de auto-detección
- Eliminada tabla `fixed_expenses`; reemplazada por columna `is_fixed BOOLEAN` en `bank_transactions` (migración `20260601_bank_transactions_is_fixed.sql`)
- Nueva tabla `fixed_patterns` con `UNIQUE(pattern)`, RLS y GRANT para persistir patrones de detección automática (migración `20260601_fixed_patterns.sql`)
- `toggleFixed(id, value, conceptoOriginal, concepto)` en `actions.ts`: marca la transacción, guarda el patrón (recortando fechas finales del banco con `toFixedPattern()`), y aplica retroactivamente ILIKE starts-with sobre el histórico
- `importTransactions` aplica los patrones activos a los movimientos recién importados para auto-marcar fijos sin intervención manual
- Nuevo Client Component `FixedPatternsPanel` (`app/finances/fixed-patterns-panel.tsx`): muestra total fijo del mes, desglose por transacción, calculadora de fondo de emergencia (3/6/12 meses) y lista de patrones activos con botón de eliminar
- Widget de Finanzas en el dashboard usa `is_fixed` de `bank_transactions` (ya no consulta `fixed_expenses`)

## [2026-06-01] Dashboard, Quests y IA: reordenación, widget enriquecido, historial contratos y fix proteínas

### Dashboard
- Nuevo orden de widgets: Quests → Bonos (si los hay) → Menú semanal → Próximos planes → Finanzas + Suministros
- Widget de Quests reemplazado por `QuestsWidgetClient.tsx`: agrupa por tipo, headers con línea separadora coloreada y contador done/total, picker de persona inline al completar desde el dashboard

### Quests
- Historial de Contratos: nueva sección en el tab "Misiones Activas" de `TasksClient.tsx` que muestra contratos completados con fecha y asignado; botón eliminar llama a la nueva action `deleteCompletedContract`
- Épicas atrasadas (`getCustomDayForWeek`): si la quest está retrasada y la semana visible es la actual, se asigna al día de hoy en lugar del lunes
- Fix calendario: contratos completados excluidos de `unscheduled` y `scheduledTasks` en `CalendarView`
- Fix icono: chips de quests pendientes en el widget del dashboard usan icono `Shield` en lugar de `Check`
- Zona horaria Madrid: `toISOString().split('T')[0]` reemplazado por `toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })` en `actions.ts` y helper `madridDate` en `app/page.tsx`

### IA menú
- Detección determinista de proteínas del menú escolar mediante diccionario `PROTEIN_KEYWORDS` con sinónimos por categoría (pollo, ternera, cerdo, pavo, cordero, pescado, huevo, legumbre)
- Temperatura reducida a 0.4 para mayor consistencia de respuestas
- Prompt actualizado: cada día incluye `PROHIBIDO en cena: X` con las proteínas detectadas, con instrucción explícita de no exceptuarlas

## [2026-05-27] Fix: quests periódicas (custom) marcan completado por fecha exacta en calendario
- Corregido bug en la vista Semana (calendario) de `TasksClient.tsx`: las quests de frecuencia `custom` usaban `isDoneInWeek` (rango lunes–domingo) en lugar de `isDoneOnDate` (fecha exacta), lo que hacía que una quest completada el miércoles apareciera tachada también el sábado (su próxima fecha de vencimiento)
- Afectaba a tres puntos: cálculo de `doneCount`, prop `isComplete` de `TaskDayRow` y cálculo de `completedBy`
- Solución: añadido `|| t.frequency === 'custom'` en las tres condiciones para que las quests épicas usen `isDoneOnDate`, igual que las diarias

## [2026-05-27] Seguridad: habilitar RLS en 15 tablas del schema public
- Detectado que 15 tablas no tenían RLS activo: el endpoint directo de Supabase era accesible con la anon key sin autenticación, saltándose el proxy de Next.js
- Habilitado `ENABLE ROW LEVEL SECURITY` + política `familia_autenticada` (`FOR ALL TO authenticated USING (true) WITH CHECK (true)`) en todas las tablas afectadas
- Tablas por módulo:
  - Finanzas: `bank_transactions`, `category_rules`, `transaction_categories`, `transaction_subcategories`
  - Suministros: `home_invoices`
  - Bonos/Servicios: `service_passes`
  - Recetas: `recipes`, `ingredients`, `recipe_ingredients`
  - Planificador de comidas: `weekly_plan`
  - Restaurantes: `restaurants`, `restaurant_lists`, `restaurant_list_items`, `reservations`, `tag_colors`
- GRANTs explícitos añadidos para la Data API (`GRANT ALL ON ... TO anon, authenticated`) para garantizar compatibilidad desde mayo 2026
- Nueva sección `## Seguridad — Supabase RLS` en `CLAUDE.md` con la convención obligatoria para tablas nuevas (patrón datos familiares compartidos y patrón datos personales)
- Migración: `supabase/migrations/20260527_enable_rls_public_tables.sql`

## [2026-05-27] Suministros: filtro de fechas, paginación y agregación mensual
- Nuevo `UtilitiesClient.tsx` que centraliza toda la interactividad de `/utilities`
- Filtro de fechas "Desde / Hasta" precargado al año en curso; las tarjetas de resumen no se ven afectadas
- Gráfica de evolución alimentada con agregación mensual (clave `YYYY-MM`, suma de importes del mes) en lugar de datos brutos por factura
- Tabla histórica paginada: selector 10/20/50 filas, contador "Mostrando X–Y de Z facturas", navegación < >
- CSV exporta solo el rango filtrado (no el histórico completo)
- Fix UTC en `line-chart.tsx`: etiquetas del eje X calculadas con `getUTC*` para evitar desfases de zona horaria

## [2026-05-27] Suministros: período de facturación variable y mejoras de importación
- Nueva columna `billing_period_months INTEGER NOT NULL DEFAULT 2` en `home_invoices`
- Parser mejorado (`processInvoice`): extrae el período de facturación del PDF con regex sobre rango de fechas (`DD/MM/YYYY – DD/MM/YYYY`), fallback a 2 meses
- Fórmula de medias corregida: de `sum / count / 2` a media ponderada `sum(amount) / sum(billing_period_months)`, eliminando el magic number bimestral
- Importación: envío de un PDF a la vez para evitar el límite de payload de Vercel (~4.5 MB); progreso visual por fichero (pending / processing / ok / error)
- Nueva columna "Período" en la tabla histórica de `/utilities`
- Bug visual corregido: alerta de tarifa cara usa amber en lugar de emerald
- CSV exportado incluye nueva columna "Período (meses)"
- Documentación: nuevo `docs/features/utilities.md`

## [2026-05-27] Fix: asignaciones de día en Quests se reseteaban al pasar medianoche
- Causa: `fmtDate` usaba `toISOString()` (UTC) para calcular el lunes de la semana, dando un día incorrecto entre medianoche y las 02:00 en Madrid (UTC+2)
- Fix: `fmtDate` ahora usa `getFullYear/getMonth/getDate` (hora local), igual que los métodos que calculan la fecha
- Se corrigen también los cálculos de `today` en `isDone`, `CalendarView` y `handleComplete/handleUncomplete`

## [2026-05-27] Docs: actualizar documentación del módulo Quests
- Renombrado `docs/features/tasks.md` → `docs/features/quests.md`
- Actualizadas referencias en texto libre de "tarea/tareas" a "quest/quests" en `quests.md`, `dashboard.md` y `auth-permissions.md`
- Los identificadores técnicos (tablas, ruta `/tasks`, permiso `tasks`) se mantienen sin cambios

## [2026-05-27] Quests: corregir etiqueta de frecuencia puntual en formulario
- El selector de tipo de misión ahora muestra "Contrato 📜" en lugar de "Única ✨", alineando el formulario de creación con el agrupador del listado (`FREQ_CONFIG.punctual.plural`)

## [2026-05-26] Quests: rediseño RPG del módulo de tareas
- Módulo de tareas renombrado a "Quests" en nav, dashboard y toda la UI
- Nuevo estilo RPG: cabecera oscura tipo tablero de gremio de aventureros con barra de XP
- Tarjetas de misiones en colores claros por frecuencia (coherente con el resto de la app)
- Iconos RPG por tipo: Swords (diarias), Shield (semanales), Gem (épicas), Crown (legendarias), ScrollText (contratos)
- Dashboard: widget actualizado con icono Swords y textos "Quests"/"misiones"

## [2026-05-23] Tareas: colores por frecuencia + completar en fechas anteriores
- Cada bloque de tareas tiene ahora un color distinto según frecuencia: azul (diarias), violeta (semanales), ámbar (periódicas), rosa (anuales), naranja (puntuales)
- La acción `completeTask` acepta una fecha opcional; si no se pasa usa hoy
- Nueva acción `uncompleteTaskOnDate` para desmarcar una completación en una fecha exacta
- En la vista de calendario, marcar/desmarcar una tarea ahora usa la fecha del día concreto, no siempre la fecha de hoy

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
