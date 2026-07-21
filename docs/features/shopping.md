# Lista de la Compra

## Rutas
- `/shopping-list` — lista de la compra compartida

## Permiso necesario
El usuario debe tener `"shopping"` en `user_metadata.permissions`.

## Tabla Supabase — `shopping_list_items`
| campo | tipo | notas |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | nombre del producto |
| `store` | text | tienda asociada (default `'Sin tienda'`) |
| `is_manual` | bool | `true` si lo añadió el usuario; `false` si se importó del planificador |
| `checked` | bool | si ya está en el carrito |
| `subgroup` | text \| null | pasillo/subgrupo de texto libre dentro de la tienda (ej. "Verduras"). `null` = sin agrupar |
| `position` | integer \| null | orden manual dentro de la tienda (drag & drop). Se recalcula por índice tras cada reorden |
| `created_at` | timestamptz | |

RLS activada desde `20260721_shopping_list_subgroups_and_rls.sql` (antes la tabla no tenía RLS): política `familia_autenticada` (`FOR ALL TO authenticated USING (true) WITH CHECK (true)`), igual que el resto de tablas familiares compartidas. El mismo fichero hace backfill de `position` para las filas existentes (agrupadas por tienda, orden por `created_at`).

## Datos cargados (`page.tsx`)
- Todos los items de `shopping_list_items` ordenados por tienda, `position` y fecha de creación
- Tiendas únicas de la tabla `ingredients` (para el selector de tienda en el formulario manual)

## Componentes UI (`shopping-list-ui.tsx`)
| componente | descripción |
|---|---|
| `ShoppingListClient` | Componente cliente principal. Sincroniza `items` con `initialItems` vía `useEffect` tras `router.refresh()` |
| `StoreSection` | Sección colapsable por tienda con contador de items. Contiene el `DndContext` único de la tienda y resuelve los contenedores de origen/destino del drag (`findItemContainerKey`, `resolveOverKey`) |
| `SubgroupBlock` | Bloque droppable (`useDroppable` + `SortableContext`) para "sin subgrupo" o un subgrupo concreto; soporta subgrupos vacíos como zona de destino ("Suelta aquí") |
| `NewSubgroupDropZone` | Zona droppable especial al final de la tienda para crear un subgrupo nuevo arrastrando un producto; muestra un input inline para nombrarlo tras soltar |
| `SortableListItem` | Envuelve `ListItem` con `useSortable` de `@dnd-kit/sortable` para el drag & drop |
| `ListItem` | Item individual con checkbox, botón de borrar y (si aplica) drag handle y chip de subgrupo |
| `SubgroupTag` | Chip editable inline para asignar/quitar el subgrupo de un producto (click para editar, blur/Enter confirma, Escape cancela) |

## Funcionalidades

### Añadir manualmente
Formulario con campo de texto y selector de tienda. Las tiendas disponibles se extraen de `ingredients.preferred_store`. El item se crea con `is_manual = true`.

### Importar del planificador semanal
Botón "Importar de la Semana" (`importWeekIngredients`). Desde la reescritura de merge (2026-07-22) **ya no borra y reinserta todo** — conserva `subgroup`, `position` y el estado `checked` de lo que ya estaba importado:
1. Obtiene las recetas planificadas para los próximos 7 días desde `weekly_plan`
2. Obtiene los ingredientes de esas recetas vía `recipe_ingredients → ingredients`, deduplicados por `(nombre, tienda)` normalizados (minúsculas, sin espacios)
3. Compara contra los items ya importados (`is_manual = false`):
   - Los que ya no aparecen en el plan de esta semana se eliminan
   - Los que siguen apareciendo se conservan intactos (no se tocan `subgroup`, `position` ni `checked`)
   - Solo los ingredientes realmente nuevos se insertan, al final de la posición de su tienda
4. Los items manuales del usuario (`is_manual = true`) **nunca se tocan**, y no se comprueban contra los nuevos ingredientes del plan (si un ingrediente manual coincide en nombre y tienda con uno importado, puede aparecer duplicado como fila separada — comportamiento heredado de antes de esta reescritura)

### Orden manual (drag & drop)
Cada tienda tiene un único `DndContext` (`@dnd-kit/core` + `@dnd-kit/sortable`) que engloba todos sus subgrupos, así que un producto se puede arrastrar tanto dentro de su propio subgrupo como a otro subgrupo distinto, a "sin subgrupo", o a la zona especial "+ Nuevo subgrupo" (ver más abajo). `StoreSection` resuelve en cada `dragOver`/`dragEnd` a qué contenedor pertenecen el item arrastrado (`activeId`) y el destino (`overId`, ya sea otro producto o el contenedor vacío de un subgrupo) mediante `findItemContainerKey`/`resolveOverKey`.

- **Reorden dentro del mismo subgrupo**: al soltar, se actualiza el estado local de forma optimista y se llama a `reorderItems`, que recalcula `position` (índice secuencial) para **todos** los items pendientes de esa tienda (no solo los del subgrupo movido) para mantener la coherencia del orden global de la tienda.
- **Mover a otro subgrupo**: al soltar sobre un subgrupo distinto (incluido "sin subgrupo"), se llama a `moveItemToSubgroup(itemId, newSubgroup, storeName, orderedIdsOfDestination)`, que en una sola Server Action actualiza el `subgroup` del item y recalcula `position` (0..n-1) de los items del subgrupo de destino, con el item movido siempre al final. El subgrupo de origen no se renumera tras el movimiento (quedan huecos en `position`, lo cual es inocuo: el orden solo depende de `ORDER BY position`, no de que sea una secuencia contigua).
- **Crear subgrupo arrastrando**: existe una zona droppable especial "+ Nuevo subgrupo" al final de cada tienda (`NewSubgroupDropZone`). Al soltar un producto ahí, se muestra un input inline para nombrar el subgrupo; al confirmar (Enter/blur) se llama a `moveItemToSubgroup` con el nombre nuevo, creando el subgrupo de facto (no existe tabla de subgrupos, es un valor de texto libre en el propio item).

En todos los casos el cambio es optimista (con snapshot del estado previo) y se revierte si la Server Action devuelve error, mostrando el mensaje en el banner.

### Subgrupos (pasillos)
Cada producto puede etiquetarse con un subgrupo de texto libre, de dos formas: editando el chip inline (`SubgroupTag`, click para editar, vía `setSubgroup`) o arrastrando el producto (ver arriba, vía `moveItemToSubgroup`). Dentro de cada tienda, los productos sin subgrupo se muestran primero (sin cabecera) y luego un bloque por cada subgrupo distinto (`SubgroupBlock`), cada uno con su propia zona droppable (soporta subgrupos vacíos como destino). Cambio optimista con revert en error en ambos casos.

### Agrupación por tienda
Los items pendientes se agrupan y muestran por tienda. Cada sección tiene cabecera con nombre de tienda y contador. La sección es colapsable. "Sin tienda" aparece siempre al final.

### Completar items
Al hacer clic en el checkbox, el item se tacha y se mueve a la sección "Ya en el carrito" (opacidad reducida). El cambio se persiste con `toggleItem(id, checked)`.

### Limpiar lista
Botón de borrador: elimina **todos** los items (manuales e importados). Pide confirmación.

## Server Actions (`actions.ts`)
| acción | descripción |
|---|---|
| `addItem` | Inserta item manual, calculando su `position` (última del store + 1) |
| `toggleItem` | Actualiza el campo `checked` |
| `deleteItem` | Elimina un item individual |
| `reorderItems(storeName, orderedIds)` | Reasigna `position` secuencial a una lista de ids dentro de una tienda |
| `setSubgroup(itemId, subgroup)` | Asigna o limpia (`null` si vacío) el subgrupo de un item |
| `moveItemToSubgroup(itemId, newSubgroup, storeName, orderedIdsOfDestination)` | Mueve un item a otro subgrupo (drag entre contenedores) y recalcula `position` del destino en una sola acción |
| `clearList` | Elimina todos los items |
| `importWeekIngredients` | Importa/mergea ingredientes del plan semanal (ver arriba) |

## Dependencias
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — drag & drop del orden manual

## Enlace con otros módulos
- `/ingredients` — gestión del catálogo de ingredientes (nombre + tienda preferida). Accesible desde un botón en la lista de la compra.
- Dashboard — el widget de menú tiene un acceso directo a `/shopping-list` con el icono de cesta.
