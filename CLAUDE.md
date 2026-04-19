# Claude Code — Instrucciones de trabajo para MiHogar

## Stack técnico
- **Framework**: Next.js 15+ App Router (Server Components + Server Actions)
- **Base de datos**: Supabase (PostgreSQL + RLS). Usar `SECURITY DEFINER` para operaciones server-side
- **Auth**: Supabase Auth. Permisos en `user_metadata.permissions` (array de strings)
- **Email**: Resend API — lazy init dentro de la función, nunca a nivel de módulo
- **Estilos**: Tailwind CSS

## Flujo de trabajo Git (OBLIGATORIO)

Antes de empezar cualquier tarea:
1. **Crear rama** con prefijo según tipo: `feat/`, `fix/`, `refactor/`, `chore/`
2. **Hacer el trabajo** en esa rama
3. Al terminar: avisar al usuario para que pruebe en local
4. Cuando el usuario dé el **OK explícito**: merge a main, push y borrar la rama local

```bash
git checkout -b feat/nombre-descriptivo
# ... trabajo ...
git add <archivos relevantes>
git commit -m "feat: descripción del cambio"
# ← ESPERAR OK DEL USUARIO antes de continuar
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
```
