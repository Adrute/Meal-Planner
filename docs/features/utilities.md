# Suministros (Utilities)

## Ruta
`/utilities` — requiere permiso `utilities` en `user_metadata.permissions`

## Archivo principal
`app/utilities/page.tsx` — Server Component con `export const dynamic = 'force-dynamic'`

## Tabla principal: `home_invoices`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `invoice_number` | text | Número de factura extraído del PDF (fallback: `DOC-<timestamp>`) |
| `issue_date` | date | Fecha de emisión de la factura |
| `total_amount` | numeric | Suma de todos los conceptos |
| `elec_amount` | numeric | Importe de electricidad |
| `gas_amount` | numeric | Importe de gas natural |
| `services_amount` | numeric | Importe de Facilita (mantenimiento) |
| `taxes_amount` | numeric | Tasas e impuestos |
| `elec_kwh` | numeric | Consumo eléctrico en kWh |
| `gas_kwh` | numeric | Consumo de gas en kWh |
| `billing_period_months` | integer | Duración del período de facturación en meses (NOT NULL DEFAULT 2) |

## Datos cargados en `page.tsx`

```ts
home_invoices.select('*').order('issue_date', { ascending: false })
```

Se cargan todas las facturas para calcular medias históricas, tendencias, la gráfica de evolución y la tabla del histórico.

## Flujo de importación

### Ruta
`/utilities/import` — `app/utilities/import/page.tsx` (Client Component)

### Funcionamiento
1. El usuario selecciona uno o varios PDFs mediante un selector de archivos (acepta `application/pdf`, atributo `multiple`)
2. Al pulsar "Procesar Facturas", los PDFs se envían **uno a la vez** mediante `FormData` a la Server Action `processInvoice`
3. Cada archivo se procesa de forma secuencial para evitar superar el límite de payload de Vercel (~4.5 MB por request)
4. La UI muestra el estado de cada fichero en tiempo real: `pending` → `processing` → `ok` / `error`
5. Si todos los ficheros se procesan correctamente, se redirige automáticamente a `/utilities`
6. Si alguno falla, se muestra el error por fichero y el resumen del resultado

### Estados de progreso por fichero
- `pending` — fichero en cola, aún no procesado
- `processing` — llamada en curso (spinner ámbar)
- `ok` — insertado correctamente (check verde, nombre tachado)
- `error` — fallo con mensaje de error (X roja + texto del error)

## Server Action: `processInvoice`

**Archivo:** `app/utilities/actions.ts`

La action recibe un `FormData` con un único campo `pdf` (tipo `File`), parsea el PDF y lo inserta en `home_invoices`.

### Extracción de campos del PDF (TotalEnergies)

| Campo | Regex / lógica |
|-------|----------------|
| Número de factura | `/(?:N[ºo°]\s+de\s+factura|Factura\s+(?:\w+\s+)?n[ºo°]):\s*([A-Z0-9]+)/i` |
| Fecha de emisión (larga) | `/Fecha\s+de\s+emisi[oó]n:\s*(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i` |
| Fecha de emisión (corta) | `/Fecha\s*(?:de\s*)?emisi[oó]n:\s*(\d{2})\.(\d{2})\.(\d{4})/i` |
| Electricidad € | `/Electricidad\s+([\d,]+)\s*€/i` |
| Gas € | `/Gas\s+([\d,]+)\s*€/i` |
| Servicios € | `/Servicios\s+([\d,]+)\s*€/i` |
| Tasas € | `/Tasas e impuestos\s+([\d,]+)\s*€/i` |
| kWh electricidad | `/(?:Electricidad\|Energía).*?([\d,]+)\s*kWh/i` |
| kWh gas | Segundo match de `/([\d,]+)\s*kWh/gi` en todo el texto |

Si `totalAmount === 0` (ningún importe detectado), la action devuelve `{ error }` sin insertar.

### Extracción del período de facturación

Función auxiliar `extractBillingPeriodMonths(cleanText)`:

1. Busca dos fechas en formato `DD/MM/YYYY` separadas por ` - ` o ` – ` (guión largo):
   ```
   /(\d{2})\/(\d{2})\/(\d{4})\s*[-–]\s*(\d{2})\/(\d{2})\/(\d{4})/
   ```
2. Calcula la diferencia en días y la convierte a meses usando `Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44))`
3. **Fallback**: si no encuentra el patrón, si la diferencia es negativa o cero, o si el resultado es 0, devuelve `2` (valor por defecto bimestral de TotalEnergies)

## Cálculo de medias mensuales (media ponderada)

Las medias se calculan como **media ponderada por período de facturación**, no como media simple:

```ts
const totalMonths = invoices.reduce((s, inv) => s + (inv.billing_period_months ?? 2), 0)
avgElec = invoices.reduce((s, inv) => s + Number(inv.elec_amount), 0) / totalMonths
avgGas  = invoices.reduce((s, inv) => s + Number(inv.gas_amount),  0) / totalMonths
avgServ = invoices.reduce((s, inv) => s + Number(inv.services_amount), 0) / totalMonths
```

**Por qué media ponderada**: TotalEnergies factura con periodicidad variable (mayoritariamente bimestral, pero puede haber facturas de 1, 3 o más meses). Dividir el importe total entre el número de meses reales evita distorsionar la media mensual cuando conviven facturas de distinta duración.

El mismo cálculo se replica en el widget de Suministros del dashboard (`app/page.tsx`).

## Componentes principales

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| `UtilitiesDashboard` | `app/utilities/page.tsx` | Página principal (Server Component) |
| `UtilitiesClient` | `app/utilities/UtilitiesClient.tsx` | Lógica interactiva: filtro, agregación, paginación (Client Component) |
| `ImportInvoicePage` | `app/utilities/import/page.tsx` | Importación de PDFs (Client Component) |
| `UtilitiesLineChart` | `app/utilities/line-chart.tsx` | Gráfica de evolución por servicio (Recharts) |
| `ExportCsvButton` | `app/utilities/export-csv.tsx` | Descarga CSV del rango filtrado |
| `processInvoice` | `app/utilities/actions.ts` | Server Action de parseo e inserción |

## `UtilitiesClient` — estado interno y lógica

`page.tsx` carga todas las facturas y las pasa como prop a `UtilitiesClient`. El componente gestiona todo lo interactivo en cliente.

### Estado local

| Estado | Tipo | Valor inicial |
|--------|------|---------------|
| `dateFrom` | `string` | `YYYY-01-01` (año en curso) |
| `dateTo` | `string` | fecha de hoy |
| `pageSize` | `10 \| 20 \| 50` | `10` |
| `currentPage` | `number` | `1` |

`useEffect` resetea `currentPage` a 1 cuando cambian `dateFrom`, `dateTo` o `pageSize`.

### Filtro de fechas

- Controles "Desde" / "Hasta" con `<input type="date">` preseleccionados al año en curso.
- Botón "Limpiar" restaura los valores por defecto (`YEAR_START` / `TODAY`).
- El filtro **solo afecta a la gráfica, la tabla histórica y el CSV** — las tarjetas de resumen (medias, tendencias, última factura) usan las props calculadas en el servidor con todas las facturas.

### Agregación mensual para la gráfica

Las facturas filtradas se agrupan por mes en `aggregatedByMonth`:

- Clave: `YYYY-MM` usando `getUTCFullYear()` / `getUTCMonth()` para evitar desfases de zona horaria.
- `issue_date` del punto: `${key}-01` (primer día del mes).
- Los importes y `billing_period_months` de facturas del mismo mes se **suman**. Esto permite mostrar un solo punto por mes aunque haya varias facturas (p. ej. si se importan facturas de luz y gas por separado).
- El resultado se pasa a `UtilitiesLineChart`.

### Paginación de la tabla histórica

- El selector "Filas" permite elegir 10, 20 o 50 registros por página.
- Contador: `Mostrando X–Y de Z facturas` visible siempre que haya datos.
- Navegación con botones `<` / `>` que se deshabilitan en el primer y último página respectivamente.
- Si solo hay una página, los controles de navegación no se renderizan.

## Secciones de la página `/utilities`

1. **Tarjetas de resumen** — tres tarjetas (Electricidad, Gas Natural, Facilita) con el importe de la última factura, la media mensual ponderada y la tendencia vs factura anterior. No afectadas por el filtro de fechas.
2. **Filtro de fechas** — controles "Desde" / "Hasta" precargados al año en curso, con botón "Limpiar".
3. **Gráfica de evolución** — `UtilitiesLineChart` alimentada con la agregación mensual del rango filtrado (Recharts, cliente).
4. **Histórico de facturas** — tabla paginada (10/20/50) con columnas: Fecha Emisión, Período, Luz, Gas, Facilita, Impuestos, Total. Botón de exportación CSV limitado al rango filtrado.

### Columna "Período" en la tabla histórica
```ts
(inv.billing_period_months ?? 1) === 1 ? '1 mes' : `${inv.billing_period_months ?? 1} meses`
```

## Widget en el dashboard (`app/page.tsx`)

El widget de Suministros en el dashboard muestra:
- Tres mini-tarjetas con la media mensual de Luz, Gas y Facilita (calculada con media ponderada)
- Alerta de tarifa: si `elec_amount / elec_kwh > 0.16 €/kWh` → alerta ámbar ("Revisa tu tarifa"); si está por debajo → mensaje verde ("Tarifa Optimizada")
- Si no hay facturas: placeholder con enlace a importar la primera factura

## Exportación CSV

`ExportCsvButton` recibe `filteredInvoices` (las facturas del rango seleccionado, no el total). Genera un CSV separado por punto y coma (compatible con Excel en España) con las columnas:
`Factura`, `Fecha Emision`, `Período (meses)`, `Electricidad`, `Gas Natural`, `Servicios`, `Impuestos`, `Total`
