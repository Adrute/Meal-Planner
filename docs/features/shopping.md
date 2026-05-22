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
| `created_at` | timestamptz | |

## Datos cargados (`page.tsx`)
- Todos los items de `shopping_list_items` ordenados por tienda y fecha de creación
- Tiendas únicas de la tabla `ingredients` (para el selector de tienda en el formulario manual)

## Componentes UI (`shopping-list-ui.tsx`)
| componente | descripción |
|---|---|
| `ShoppingListClient` | Componente cliente principal |
| `StoreSection` | Sección colapsable por tienda con contador de items |
| `ListItem` | Item individual con checkbox y botón de borrar |

## Funcionalidades

### Añadir manualmente
Formulario con campo de texto y selector de tienda. Las tiendas disponibles se extraen de `ingredients.preferred_store`. El item se crea con `is_manual = true`.

### Importar del planificador semanal
Botón "Importar de la Semana" (`importWeekIngredients`):
1. Obtiene las recetas planificadas para los próximos 7 días desde `weekly_plan`
2. Obtiene los ingredientes de esas recetas vía `recipe_ingredients → ingredients`
3. Elimina los items con `is_manual = false` (los importados anteriormente)
4. Inserta los ingredientes frescos, cada uno con su `preferred_store`
5. Los items manuales del usuario **no se tocan**

### Agrupación por tienda
Los items pendientes se agrupan y muestran por tienda. Cada sección tiene cabecera con nombre de tienda y contador. La sección es colapsable. "Sin tienda" aparece siempre al final.

### Completar items
Al hacer clic en el checkbox, el item se tacha y se mueve a la sección "Ya en el carrito" (opacidad reducida). El cambio se persiste con `toggleItem(id, checked)`.

### Limpiar lista
Botón de borrador: elimina **todos** los items (manuales e importados). Pide confirmación.

## Server Actions (`actions.ts`)
| acción | descripción |
|---|---|
| `addItem` | Inserta item manual |
| `toggleItem` | Actualiza el campo `checked` |
| `deleteItem` | Elimina un item individual |
| `clearList` | Elimina todos los items |
| `importWeekIngredients` | Importa ingredientes del plan semanal (ver arriba) |

## Enlace con otros módulos
- `/ingredients` — gestión del catálogo de ingredientes (nombre + tienda preferida). Accesible desde un botón en la lista de la compra.
- Dashboard — el widget de menú tiene un acceso directo a `/shopping-list` con el icono de cesta.
