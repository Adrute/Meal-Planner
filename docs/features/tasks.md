# Tareas del Hogar

## Rutas
- `/tasks` — gestión y seguimiento de tareas domésticas

## Permiso necesario
El usuario debe tener `"tasks"` en `user_metadata.permissions`.

## Tablas Supabase

### `household_tasks`
| campo | tipo | notas |
|---|---|---|
| `id` | uuid | PK |
| `title` | text | nombre de la tarea |
| `frequency` | text | `daily` / `weekly` / `custom` / `annual` / `punctual` |
| `day_of_week` | text\|null | día habitual para tareas semanales |
| `assigned_to` | text\|null | nombres separados por coma (multi-asignación) |
| `notes` | text\|null | notas libres |
| `custom_interval_days` | int\|null | intervalo en días para tareas periódicas |

### `task_completions`
| campo | tipo | notas |
|---|---|---|
| `id` | uuid | PK |
| `task_id` | uuid | FK household_tasks |
| `completed_date` | date | fecha de realización |
| `completed_by` | text\|null | nombre de quien realizó la tarea |

### `task_week_assignments`
Sobreescritura semanal de día asignado y responsable (sin alterar los valores por defecto de la tarea).
| campo | tipo | notas |
|---|---|---|
| `task_id` | uuid | FK household_tasks |
| `week_start` | date | lunes de la semana (YYYY-MM-DD) |
| `day_of_week` | text\|null | override del día para esta semana |
| `assigned_to` | text\|null | override del asignado para esta semana |

## Datos cargados (`page.tsx`)
- Todas las `household_tasks` ordenadas por frecuencia, día y título
- Todas las `task_completions` del año en curso
- Todos los `profiles` (id, display_name, email)
- Todos los `task_week_assignments` del año en curso

## Frecuencias disponibles
| valor | etiqueta | Lógica de "completada" |
|---|---|---|
| `daily` | Diaria | Si hay completion con `completed_date = hoy` |
| `weekly` | Semanal | Si hay completion en el rango lunes–domingo de la semana actual |
| `custom` | Periódica | Si la última completion fue hace menos de `custom_interval_days` días |
| `annual` | Anual | Si hay completion en el año en curso |
| `punctual` | Puntual | Si existe alguna completion (se completa una sola vez) |

## Vistas (tabs)

### Tab "Esta semana" (`pending`)
- Agrupa tareas por frecuencia en el orden: diaria → semanal → periódica → anual → puntual
- Las tareas periódicas solo aparecen si su próxima fecha de vencimiento cae en la semana actual o ya está vencida
- Las semanales se ordenan por día de la semana
- Barra de progreso por grupo y barra global en la cabecera

### Tab "Gestionar" (`all`)
- Lista plana de todas las tareas agrupadas por frecuencia
- Iconos de editar y eliminar visibles al hacer hover
- Formulario inline de edición

### Tab "Semana" (calendario, `calendar`)
- Vista de 7 días (lunes–domingo) navegable con flechas
- Muestra tareas diarias en cada día
- Muestra tareas no diarias en el día asignado (`task_week_assignments` > `household_tasks.day_of_week`)
- Sección "Sin asignar esta semana" para tareas sin día para la semana visible
- Las tareas periódicas (`custom`) aparecen en el día en que vencen (o el lunes si ya han vencido)

## Componentes principales (`TasksClient.tsx`)
| componente | descripción |
|---|---|
| `TaskForm` | Formulario de creación/edición con todos los campos. Para tareas periódicas permite especificar la fecha de la última realización al crearla |
| `TaskCard` | Tarjeta en el tab "Esta semana": checkbox, badge de persona, badge de día; despliega pickers inline |
| `TaskDayRow` | Fila en el tab "Semana" (calendario) |
| `CalendarView` | Vista semanal completa con navegación de semanas |

## Asignación por semana
Cada semana puede sobreescribir el día y el responsable de una tarea sin modificar sus valores por defecto:
- Click en el badge de día → abre picker de día para esa semana
- Click en el badge de persona → abre picker de asignado para esa semana
- Se persiste en `task_week_assignments` con upsert manual (select + update/insert)

## Multi-asignación
El campo `assigned_to` almacena nombres separados por coma: `"Adrián, Paula"`. Los componentes convierten entre array y string con `parseNames` / `joinNames`. La opción `N/A` indica que la tarea no está asignada a nadie concreto.

## Server Actions (`actions.ts`)
| acción | descripción |
|---|---|
| `createTask` | Inserta en `household_tasks`. Si se pasa `last_done_date`, inserta también en `task_completions` |
| `updateTask` | Actualiza campos de la tarea |
| `deleteTask` | Elimina la tarea (las completions en cascada o quedan huérfanas) |
| `completeTask` | Inserta en `task_completions` con fecha de hoy y la persona indicada |
| `uncompleteTask` | Elimina completions del período correspondiente a la frecuencia (`today`, `week`, `year`, `recent`, `all`) |
| `setTaskWeekDay` | Upsert manual en `task_week_assignments` para el día de la semana |
| `setTaskWeekAssignee` | Upsert manual en `task_week_assignments` para el asignado |

## Widget en el Dashboard
`TasksWidget` en `app/page.tsx`:
- Carga solo tareas `daily` y `weekly` con sus completions de la semana actual
- Muestra barra de progreso, contador y chips de tareas pendientes (máx. 6, con "+N más")
- Se filtra `Admin` de la lista de perfiles con `filterProfiles`

## Lógica de próxima fecha (tareas periódicas)
```ts
nextDueDate = lastCompletionDate + custom_interval_days
```
Si nunca se ha completado → vence hoy. Si la fecha de vencimiento ya pasó → aparece al inicio de la semana en el calendario.
