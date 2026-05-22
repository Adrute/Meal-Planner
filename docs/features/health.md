# Salud

## Tablas Supabase
Todas tienen RLS — cada usuario solo ve y modifica sus propios registros.

- `weight_logs`: `id`, `user_id`, `date` (unique por usuario), `weight_kg`, `notes`, `created_at`
- `running_logs`: `id`, `user_id`, `date`, `distance_km`, `duration_minutes`, `feeling` (1-5), `notes`, `created_at`
- `hydration_logs`: `id`, `user_id`, `date` (unique por usuario), `glasses` (int), `created_at` — tabla existente en BD pero la sección de hidratación fue **eliminada de la UI** (commit `16b4deb`). El archivo `HydrationChart.tsx` y las actions `upsertHydrationLog` / `deleteHydrationLog` están presentes pero no se usan en producción.

## Rutas
- `/health` — dashboard personal de salud

## Permiso necesario
El usuario debe tener `"health"` en `user_metadata.permissions`.

## Módulo Peso
- Registro diario (upsert por fecha — un registro por día)
- Stats: peso actual, peso inicial, diferencia total con indicador ↑↓
- Gráfica de línea temporal (recharts) con línea de referencia en la media
- Historial ordenado descendente con borrado por fila

## Módulo Running
- Registro por salida: fecha, distancia (km), duración (h + min separados), sensación (emoji 1-5), nota
- Ritmo (min/km) calculado en cliente a partir de duración/distancia
- Stats: km totales, número de salidas, ritmo medio
- Gráfica de barras de distancia por sesión
- Gráfica de línea de evolución del ritmo (min/km)
- Historial con todos los datos por fila y borrado

## Visualización maximizable
Cada sección (Peso, Running) tiene un botón de maximizar (`Maximize2`) que la expande a pantalla completa usando `fixed inset-0 z-50`. El botón cambia a `X` para minimizar.

## Privacidad
`user_id` se extrae del token de Supabase en el servidor (`supabase.auth.getUser()`), nunca del cliente. Las RLS policies garantizan aislamiento a nivel de base de datos.

## Datos cargados (`page.tsx`)
```ts
weight_logs.select('id, date, weight_kg, notes').eq('user_id', user.id).order('date')
running_logs.select('id, date, distance_km, duration_minutes, feeling, notes').eq('user_id', user.id).order('date')
```
Los datos de hidratación no se cargan (sección eliminada de la UI).
