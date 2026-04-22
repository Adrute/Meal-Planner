# Navegación & Layout

## Componente principal
`components/AppNavigation.tsx` — Client Component

### Props
```ts
{ permissions: string[], isAdmin: boolean, displayName: string }
```

## Desktop
- Sidebar fijo a la izquierda (`w-64`)
- Links filtrados por `permissions`
- Link Admin solo si `isAdmin`
- Footer con avatar + `displayName` + botón logout

## Móvil
- **Header fijo** (`h-14`, `z-[199]`) con botón hamburguesa — evita solapamiento con el contenido
- **Sidebar deslizante** desde la izquierda (`z-[201]`)
- **Overlay** de fondo (`z-[200]`) — click cierra el sidebar
- El contenido principal tiene `pt-14 md:pt-0` para compensar el header

## Layout principal
`app/layout.tsx`:
```tsx
<div className="flex h-screen">
  <AppNavigation ... />
  <main className="flex-1 h-screen overflow-y-auto pt-14 md:pt-0">
    {children}
  </main>
</div>
```

## Carga de datos del usuario
`app/layout.tsx` llama a `get_my_profile()` RPC de Supabase:
- Devuelve `display_name`, `permissions`, `is_admin`
- Se usa para renderizar `AppNavigation` con los datos correctos

## Permisos en la navegación
Los links del sidebar se filtran con `permissions.includes(key)`, lo que oculta
las secciones a las que el usuario no tiene acceso. La protección real de las rutas
está en `proxy.ts`.

## Secciones disponibles
`meals`, `recipes`, `shopping`, `finances`, `utilities`, `services`, `restaurants`, `wishlist`, `health`, `trips`.
Cada una con su key, href, icono lucide y colores activo/hover definidos en `ALL_NAV_ITEMS`.

## Dashboard (`app/page.tsx`)
- **Widget Menú**: ancho completo, muestra hoy + próximos 3 días en grid de 4 columnas (Cole / Almuerzo / Cena por día)
- **Widget Próximos Planes**: dos columnas — reservas de restaurantes (izquierda) + viajes (derecha)
  - Viajes: próximo viaje destacado + contadores por estado
- **Widget Finanzas**: gasto mes actual vs anterior, top 3 categorías
- **Widget Suministros**: medias de luz/gas/servicios, alerta de tarifa
- **Módulo Bonos**: detalle completo si hay bonos activos
