# Recetario

## Tablas Supabase
- `recipes`: `id`, `name`, `category`, `prep_time` (int, minutos), `is_favorite` (bool), `steps` (jsonb array de strings), `instructions` (text), `created_at`
- `recipe_ingredients`: `recipe_id`, `ingredient_id`, `amount` (text, ej: "200 g")
- `ingredients`: `id`, `name`, `preferred_store`

## Rutas
- `/recipes` — listado con filtros y agrupación
- `/recipes/new` — formulario de creación
- `/recipes/[id]` — detalle
- `/recipes/[id]/edit` — formulario de edición

## Lógica de negocio

### Categorías
Predefinidas: Pasta, Arroces, Carnes, Pescado, Verduras, Legumbres, Sopas, Huevos, Ensaladas, Postres, Otros. Se almacenan como texto libre en `recipes.category`.

### Favoritas
Campo `is_favorite` en `recipes`. Toggle via Server Action `toggleFavorite(id, current)`. Se muestra estrella ⭐ en tarjeta y detalle.

### Filtros en listado
Por categoría (`?category=X`) y favoritas (`?favorites=1`) via `searchParams`. Sin filtro: agrupación visual por categoría con emoji representativo por tipo.

### Ingredientes y unidades
Al guardar, `amount` y `unit` se combinan como `"${amount} ${unit}"` en `recipe_ingredients.amount`. Al editar, se parsea el string para separar valor y unidad conocida.

Unidades soportadas: g, kg, ml, cl, dl, l, tazas, cucharadas, cucharaditas, uds, dientes, latas, puñados, rodajas, al gusto.

### Formulario compartido
`app/recipes/RecipeForm.tsx` sirve tanto para crear como editar (prop `mode: 'create' | 'edit'`). Incluye validación con Zod + react-hook-form, errores inline y banner resumen.

### Borrar receta
`DeleteRecipeButton` (client component) confirma con `window.confirm` antes de llamar la Server Action `deleteRecipe`, que elimina primero `recipe_ingredients` y luego `recipes`.

### Exportar recetario
Botón "Exportar" en la cabecera del listado. Descarga un fichero `.md` (`recetas-YYYY-MM-DD.md`) mediante `GET /api/recipes/export`. El endpoint autentica al usuario con `supabase.auth.getUser()` (401 si no autenticado), filtra las recetas que tienen al menos un ingrediente y genera Markdown con nombre, ID, categoría, tiempo, favorita, ingredientes y pasos.

### Panel de recetas vacías
`EmptyRecipesPanel` (client component) se renderiza en la cabecera del listado cuando existen recetas sin ingredientes. La `page.tsx` hace una consulta adicional con `recipe_ingredients(count)` para obtener el subconjunto vacío. El panel es colapsable; la cabecera (con contador y botón eliminar) permanece siempre visible. La selección es por checkboxes; la action `deleteEmptyRecipes(ids)` borra por lote con `.delete().in('id', ids)` y llama `revalidatePath('/recipes')`.
