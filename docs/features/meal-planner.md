# Planificador de comidas

## Tablas Supabase
- `weekly_plan`: `id`, `day_date` (date), `meal_type` (text: "Almuerzo" | "Cena"), `recipe_id` (fk recipes)
- `school_menu_items`: `id`, `date` (date), `first_course`, `second_course`, `dessert`
- `household_members`: `id`, `name`, `role` ("adult" | "child"), `restrictions` (jsonb array de `{food, type}`)

## Rutas
- `/meals` — planificador semanal + sección menú escolar + sección miembros del hogar

## Lógica de negocio

### Planificador semanal
`PlannerContainer` muestra las semanas visibles (por defecto la actual). Cada `WeekBlock` renderiza los 7 días con slots de Almuerzo y Cena. Al hacer clic en un slot vacío abre `RecipeSelectorModal` para asignar una receta existente.

Las semanas se añaden manualmente con un date picker o se auto-incluyen si hay plan guardado para esas fechas.

### Menú escolar (cole)
Se importa un PDF mensual arrastrándolo a `SchoolMenuSection`. El PDF se envía a `/api/parse-school-menu` que usa `unpdf` para extraer texto y un **parser determinista** (`parseCoomedoresBlanco`) para estructurar los datos en JSON. El parser funciona así:
1. Detecta año (el más alto encontrado en el texto) y mes
2. Localiza la cabecera del calendario ("JUEVES VIERNES")
3. Identifica semanas como grupos de 5 números consecutivos ascendentes en ≤300 chars
4. Para cada semana extrae los platos separando por marcadores de postre (`YOGUR`, `FRUTA y LECHE`) y festivos

Se guardan todos los días laborables del mes en `school_menu_items` (upsert por fecha). En el planificador y en el dashboard, cada día muestra el menú del cole con el icono de graduación y badge "Cole".

El parser está ajustado al formato de **Comedores Blanco** específicamente.

### Generación de cenas con IA
Botón "Generar Cenas IA" en cada `WeekBlock`. Llama a `/api/generate-meal-plan` con:
- Fechas de la semana (lunes–viernes)
- Menú escolar de esa semana (filtrado por fecha)
- Recetas guardadas
- Miembros del hogar con restricciones

La IA (Groq Llama 3.3 70b) propone cenas complementarias al menú escolar (evita repetir proteína/legumbres) y aptas para bebé de 18 meses. Usa recetas existentes si encajan; si no, propone plato nuevo. Los resultados se guardan via `assignMealByName` que crea una receta mínima si no existe.

### Miembros del hogar
CRUD completo en `HouseholdMembersSection`. Las restricciones se guardan como chips `{food, type}` donde `type` puede ser "alergia", "intolerancia" o "preferencia".

### Integración gratuita
Groq API — tier gratuito, sin tarjeta de crédito. Modelo: `llama-3.3-70b-versatile`. Variable de entorno: `GROQ_API_KEY`.
