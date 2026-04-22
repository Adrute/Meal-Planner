# FamilyTools

Aplicación de gestión familiar todo-en-uno. Construida con Next.js 15, Supabase y Tailwind CSS.

---

## Módulos

### Dashboard (/)
Página de inicio con resumen de todos los módulos:
- **Widget de Finanzas**: gasto del mes actual, comparativa con el mes anterior (%) y top 3 categorías de gasto del mes pasado
- **Widget de Reservas**: próximas reservas en restaurantes
- **Widget de Bonos**: bonos activos con su estado de sesiones y acceso rápido para consumir sesiones

---

### Comidas / Planificador (`/meals`)
Planificador semanal de menús:
- Vista de la semana actual (desde ayer en adelante)
- Asigna recetas a cada día y tipo de comida (desayuno, comida, cena, etc.)
- Selector de recetas desde el catálogo existente

---

### Recetas (`/recipes`)
Catálogo de recetas del hogar:
- CRUD completo de recetas
- Cada receta tiene nombre, ingredientes, instrucciones y categoría
- Las recetas se usan como fuente en el planificador de comidas

---

### Lista de Compra (`/shopping-list`)
Lista de la compra compartida:
- Añadir artículos manualmente indicando tienda
- Los artículos se agrupan por tienda (obtenida del catálogo de ingredientes)
- Marcar artículos como comprados
- Las tiendas disponibles en el selector vienen del campo `preferred_store` de los ingredientes

---

### Finanzas (`/finances`)

Gestión de movimientos bancarios y análisis de gastos.

**Importación de movimientos:**
- Importar fichero CSV o Excel (xlsx) con los movimientos del banco
- Las reglas de categorización se aplican automáticamente al importar

**Visualización:**
- Selector de mes para filtrar movimientos
- Resumen: ingresos, gastos netos y balance del mes
- Desglose de gastos por categoría con cálculo neto (los reembolsos en categorías de gasto descuentan del total)
- Detalle de movimientos con búsqueda y filtros

**Cálculo de gastos netos:**
Si pagas 200 € y te ingresan 100 € en la misma categoría no-income, el gasto neto contabilizado es 100 €. Evita falsear el gasto real cuando se comparte una compra.

**Acciones desde toolbar (4 modales):**
- **Categorías**: crear, editar y eliminar categorías; marcar si es de ingresos (`is_income`)
- **Reglas**: reglas de categorización automática por palabra clave
- **Revisión**: panel con todas las transacciones marcadas como "necesita revisión" (de todos los meses)
- **Exportar**: descarga CSV o Excel con los movimientos del mes visible

**Flag "Necesita revisión":**
- Botón de bandera ámbar en cada movimiento (visible en hover, siempre visible si está activo)
- Los movimientos marcados aparecen en el panel Revisión hasta que se desmarcan

**Acciones en cabecera:**
- Importar CSV/Excel
- Eliminar todos los movimientos

---

### Suministros / Utilidades (`/utilities`)

Seguimiento de facturas del hogar (TotalEnergies — Luz, Gas, Facilita).

**Tarjetas de resumen:**
- Última factura de Electricidad, Gas Natural y Facilita
- Media mensual de cada servicio
- Indicador de tendencia respecto a la factura anterior (subida/bajada en €)

**Gráfico de evolución:**
- Líneas de evolución de los últimos 6 meses por tipo de servicio

**Histórico de facturas:**
- Tabla completa con todas las facturas importadas
- Exportar a CSV

**Importar facturas:** `/utilities/import`

---

### Servicios & Bonos (`/services`)

Control de bonos de servicios con sesiones (clases, fisio, gimnasio, etc.).

**Por cada bono:**
- Nombre del servicio, número de sesiones totales, precio pagado y fecha de pago
- Barra de progreso visual (verde → rojo al agotarse)
- Historial de fechas de sesiones consumidas (chips)
- Consumir sesión con selector de fecha
- Renovar bono (resetea contador y fecha de pago) cuando se agota
- Eliminar bono

**Notificación automática:**
Al consumir la última sesión de un bono se envía un email a la cuenta configurada avisando del agotamiento. Ver [Email](#email).

---

### Restaurantes (`/restaurants`)

Mapa interactivo de restaurantes con gestión de listas y reservas.

**Mapa:**
- Visualización de restaurantes geolocalizados
- Filtros por estado y etiquetas (con colores personalizables)
- Estados: `liked`, `want_to_go`, `disliked`, etc.

**Listas:**
- Crear listas personalizadas de restaurantes (ej. "Románticos", "Con niños")
- Asignar restaurantes a varias listas

**Reservas:**
- Crear reservas con fecha y hora
- Las reservas pasadas se eliminan automáticamente al cargar la página
- Las próximas reservas aparecen en el widget del Dashboard

**Gestión de restaurantes:**
- Añadir, editar y eliminar restaurantes
- Asignar etiquetas con color personalizado

---

### Lista de Deseos (`/wishlist`)

Lista de deseos personal con compartición familiar.

**Elementos:**
- Nombre, descripción, tipo (objeto / evento / experiencia), URL de referencia, precio estimado y prioridad (alta / media / baja)
- Barra de color en la tarjeta según prioridad
- Marcar como "Conseguido" (queda tachado y al 60% de opacidad)
- Filtrar por tipo y mostrar/ocultar conseguidos
- Ordenación automática por prioridad

**Compartir con familia (in-app):**
- Seleccionar usuarios de la app con los que compartir cada elemento
- Los elementos compartidos aparecen en la sección "Compartido conmigo" (solo lectura)

**Compartir por WhatsApp:**
- Activar flag "WhatsApp" en los elementos que quieres incluir
- Botón genera texto formateado con emoji, nombre, precio y enlace
- Abre WhatsApp directamente o copia al portapapeles

---

### Panel de Administración (`/admin`)

Solo accesible para el administrador.

- **Usuarios**: ver todos los usuarios registrados
- **Crear usuario**: nombre, email y contraseña; se crea con todos los permisos activos por defecto
- **Eliminar usuario**
- **Permisos por usuario**: 8 chips (meals, recipes, shopping, finances, utilities, services, restaurants, wishlist) para activar/desactivar el acceso a cada módulo

---

## Sistema de permisos

- Los permisos se almacenan en `user_metadata.permissions` (JWT) y en la tabla `profiles`
- El sidebar filtra los enlaces según los permisos del usuario
- `proxy.ts` protege las rutas en el servidor; redirige a `/` si no tiene permiso
- Sin DB call en la comprobación de permisos (se lee del JWT)

---

## Email

Proveedor: **Resend**

| Notificación | Cuándo se dispara |
|---|---|
| Bono agotado | Al consumir la última sesión de un bono (desde `/services` o desde el Dashboard) |

Destinatario: variable de entorno `NOTIFY_EMAIL` (default: `claudrian1992@gmail.com`)

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15+ (App Router, Server Components, Server Actions) |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Email | Resend |
| Estilos | Tailwind CSS |
| Despliegue | Vercel |

---

## Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
NOTIFY_EMAIL        # opcional, default: claudrian1992@gmail.com
```

---

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Documentación interna

- [`CHANGELOG.md`](./CHANGELOG.md) — historial de cambios
- [`docs/features/`](./docs/features/) — lógica detallada de cada módulo
