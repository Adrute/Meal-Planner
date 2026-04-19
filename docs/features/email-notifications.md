# Notificaciones Email

## Setup
- Proveedor: **Resend** (`resend` npm package)
- API Key: `RESEND_API_KEY` en variables de entorno
- Destinatario: `NOTIFY_EMAIL` env var (default: `claudrian1992@gmail.com`)

## Implementación
`lib/email.ts` — el cliente Resend se inicializa **dentro de la función**, nunca a nivel de módulo:
```ts
export async function sendBonoAgotadoEmail(...) {
  if (!process.env.RESEND_API_KEY) return  // guard para builds sin la key
  const resend = new Resend(process.env.RESEND_API_KEY)  // lazy init
  ...
}
```
Esto evita errores en build time cuando la key no está disponible.

## Notificaciones disponibles

### Bono agotado
- **Cuándo**: al consumir la última sesión de un bono
- **Asunto**: `🔴 Bono agotado: {serviceName}`
- **Contenido**: nombre del servicio, sesiones totales, importe pagado
- **Disparado desde**:
  - `app/services/page.tsx` → `consumeSession`
  - `app/page.tsx` → `consumeSession` (dashboard)

## Añadir nuevas notificaciones
1. Exportar nueva función desde `lib/email.ts`
2. Llamarla desde la Server Action correspondiente
3. El email en Resend free tier solo puede enviarse a emails verificados en la cuenta Resend
