# Salud

## Tablas Supabase
Ambas tablas tienen RLS — cada usuario solo ve y modifica sus propios registros.

- `weight_logs`: `id`, `user_id`, `date` (unique por usuario), `weight_kg`, `notes`, `created_at`
- `running_logs`: `id`, `user_id`, `date`, `distance_km`, `duration_minutes`, `feeling` (1-5), `notes`, `created_at`

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

## Privacidad
`user_id` se extrae del token de Supabase en el servidor (`supabase.auth.getUser()`), nunca del cliente. Las RLS policies garantizan aislamiento a nivel de base de datos.
