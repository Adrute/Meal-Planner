# Claude Code — Instrucciones de trabajo para FamilyTools

## Stack técnico
- **Framework**: Next.js 15+ App Router (Server Components + Server Actions)
- **Base de datos**: Supabase (PostgreSQL + RLS). Usar `SECURITY DEFINER` para operaciones server-side
- **Auth**: Supabase Auth. Permisos en `user_metadata.permissions` (array de strings)
- **Email**: Resend API — lazy init dentro de la función, nunca a nivel de módulo
- **Estilos**: Tailwind CSS

## Flujo de trabajo Git (OBLIGATORIO — SIN EXCEPCIONES)

> ⚠️ **NUNCA** hacer merge a main ni `git push` hasta que el usuario dé el OK explícito. Aplica a toda tarea, por pequeña que sea.

Antes de empezar cualquier tarea:
1. **Crear rama** con prefijo según tipo: `feat/`, `fix/`, `refactor/`, `chore/`
2. **Hacer el trabajo** en esa rama
3. Al terminar: avisar al usuario para que pruebe en local — **PARAR AQUÍ**
4. Cuando el usuario dé el **OK explícito** ("ok", "publica", "mergea", etc.): merge a main, push y borrar la rama local

```bash
git checkout -b feat/nombre-descriptivo
# ... trabajo ...
git add <archivos relevantes>
git commit -m "feat: descripción del cambio"
# ← ESPERAR OK DEL USUARIO — NO hacer merge ni push sin confirmación
git checkout main
git merge feat/nombre-descriptivo
git push origin main
git branch -d feat/nombre-descriptivo
```

5. **Actualizar `CHANGELOG.md`** con la fecha y descripción de los cambios.

## Changelog
Cada vez que se completa una tarea, añadir una entrada en [CHANGELOG.md](./CHANGELOG.md) con el formato:
```
## [YYYY-MM-DD] Descripción breve
- Detalle 1
- Detalle 2
```

## Documentación de funcionalidades
Los ficheros `.md` en [docs/features/](./docs/features/) describen la lógica de cada módulo. Actualizarlos cuando cambie la lógica de negocio.

## Convenciones de código
- Sin comentarios excepto cuando el "por qué" no es obvio
- Sin abstracciones prematuras — tres líneas similares antes de extraer
- Validación solo en los bordes del sistema (input usuario, APIs externas)
- Las Server Actions van en el mismo archivo si son pequeñas, o en `actions.ts` si el archivo es grande
- Permisos: leer de `user_metadata` en proxy.ts, nunca hacer DB call en middleware

## Rutas y permisos
Ver [docs/features/auth-permissions.md](./docs/features/auth-permissions.md)

## Variables de entorno necesarias
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
NOTIFY_EMAIL (opcional, default: claudrian1992@gmail.com)
GROQ_API_KEY  (planificador IA — tier gratuito en console.groq.com)
```

## Lessons Learned

Patrones problemáticos que han aparecido en este proyecto y cómo evitarlos:

### useState(prop) sin useEffect de sincronización
**Problema**: `useState(serverProp)` solo inicializa el estado con el valor del primer render. Cuando el Server Component refresca via `router.refresh()`, el prop cambia pero el estado local no se actualiza.

**Solución**: Añadir `useEffect` de sincronización:
```ts
useEffect(() => { setLocalCompletions(completions) }, [completions])
useEffect(() => { setLocalWeekAssignments(weekAssignments) }, [weekAssignments])
```
Ver commit `467f509`.

### Upsert sin UNIQUE constraint en la base de datos
**Problema**: Supabase/PostgreSQL ignora el campo `onConflict` si no existe un UNIQUE constraint real en la tabla. El upsert se convierte en un insert silencioso y se crean duplicados.

**Solución**: Crear el constraint en la migración antes de usar upsert:
```sql
ALTER TABLE weight_logs ADD CONSTRAINT weight_logs_user_date UNIQUE (user_id, date);
```

### Resend inicializado a nivel de módulo
**Problema**: `const resend = new Resend(process.env.RESEND_API_KEY)` a nivel de módulo falla en build time porque la variable de entorno no está disponible en ese momento.

**Solución**: Inicialización lazy dentro de la función:
```ts
export async function sendBonoAgotadoEmail(...) {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  ...
}
```

### Parsers de PDF basados en IA — no deterministas
**Problema**: Un parser LLM para el menú escolar producía errores de desfase de días (el lunes se asignaba al martes, etc.) de forma inconsistente.

**Solución**: Parser determinista que detecta las cabeceras de semana (5 números consecutivos ascendentes) y los marcadores de postre como anclas. Más robusto y predecible. Ver commits `36cf142` y `f4ae647`.

### Server Actions duplicadas entre dashboard y módulo
**Patrón observado**: `consumeSession`, `renewService` y `deleteService` están definidas tanto en `app/page.tsx` como en `app/services/page.tsx` con lógica idéntica.

**Riesgo**: Si se modifica la lógica en un sitio, hay que acordarse de hacerlo en el otro.

**Solución futura**: Extraer a `app/services/actions.ts` e importar desde ambas páginas.

### Órdenes Leaflet / SSR
**Problema**: Leaflet accede a `window` en el import y falla en SSR de Next.js.

**Solución**: Siempre cargar componentes de mapa con `dynamic(..., { ssr: false })`:
```ts
const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })
```

### Trips — user_id en tablas hijas
**Problema inicial**: Las tablas hijas de viajes (`trip_transport`, etc.) usaban RLS basada en `user_id`, pero los viajes son compartidos entre toda la familia.

**Solución**: Las tablas hijas filtran por `EXISTS (SELECT 1 FROM trips WHERE id = trip_id)` sin `user_id`, y los viajes no tienen `user_id` en los filtros de consulta. Ver commit `516da8b`.

## Seguridad — Supabase RLS

El middleware `proxy.ts` solo protege las rutas de Next.js. El endpoint directo de Supabase (`https://<proyecto>.supabase.co/rest/v1/<tabla>`) es accesible con la anon key sin pasar por Next.js. Sin RLS activo, cualquiera que conozca la anon key puede leer y escribir datos sin autenticación.

**Regla**: toda tabla nueva debe incluir `ENABLE ROW LEVEL SECURITY` + política + GRANT en el mismo commit que la crea.

### Patrón — datos familiares compartidos

Todos los miembros autenticados ven y editan todo (finanzas, recetas, restaurantes, viajes, etc.):

```sql
ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "familia_autenticada" ON <tabla>
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Patrón — datos personales

Cada usuario solo accede a sus propios registros (salud, wishlist, etc.):

```sql
ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solo_propietario" ON <tabla>
  FOR ALL
  USING (auth.uid() = user_id);
```

### GRANT requerido (desde mayo 2026)

Las tablas nuevas requieren GRANTs explícitos para la Data API. Las existentes los tienen implícitos, pero es buena práctica incluirlos en la misma migración:

```sql
GRANT ALL ON <tabla> TO anon, authenticated;
```
