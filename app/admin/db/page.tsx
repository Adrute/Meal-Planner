import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TableExplorer from './TableExplorer'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'claudrian1992@gmail.com'
const PAGE_SIZE = 50

export const TABLES = [
  { name: 'profiles',                  label: 'Perfiles',          module: 'Auth'         },
  { name: 'recipes',                   label: 'Recetas',           module: 'Comidas'      },
  { name: 'ingredients',               label: 'Ingredientes',      module: 'Comidas'      },
  { name: 'weekly_plan',               label: 'Plan semanal',      module: 'Comidas'      },
  { name: 'school_menu_items',         label: 'Menú escolar',      module: 'Comidas'      },
  { name: 'bank_transactions',         label: 'Movimientos',       module: 'Finanzas'     },
  { name: 'transaction_categories',    label: 'Categorías',        module: 'Finanzas'     },
  { name: 'transaction_subcategories', label: 'Subcategorías',     module: 'Finanzas'     },
  { name: 'category_rules',            label: 'Reglas',            module: 'Finanzas'     },
  { name: 'home_invoices',             label: 'Facturas',          module: 'Suministros'  },
  { name: 'service_passes',            label: 'Bonos',             module: 'Bonos'        },
  { name: 'restaurants',               label: 'Restaurantes',      module: 'Restaurantes' },
  { name: 'reservations',              label: 'Reservas',          module: 'Restaurantes' },
  { name: 'wishlist_items',            label: 'Lista de deseos',   module: 'Wishlist'     },
  { name: 'weight_logs',               label: 'Peso',              module: 'Salud'        },
  { name: 'running_logs',              label: 'Running',           module: 'Salud'        },
  { name: 'hydration_logs',            label: 'Hidratación',       module: 'Salud'        },
  { name: 'trips',                     label: 'Viajes',            module: 'Viajes'       },
  { name: 'trip_transport',            label: 'Transporte',        module: 'Viajes'       },
  { name: 'trip_accommodations',       label: 'Alojamiento',       module: 'Viajes'       },
  { name: 'trip_activities',           label: 'Itinerario',        module: 'Viajes'       },
  { name: 'trip_pois',                 label: 'Lugares',           module: 'Viajes'       },
  { name: 'trip_expenses',             label: 'Gastos viaje',      module: 'Viajes'       },
  { name: 'trip_checklist',            label: 'Checklist viaje',   module: 'Viajes'       },
]

export default async function DbExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; page?: string }>
}) {
  const serverClient = await createServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  const params = await searchParams
  const tableName = params.table || TABLES[0].name
  const page = Math.max(1, parseInt(params.page || '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const validTable = TABLES.find(t => t.name === tableName)
  if (!validTable) redirect('/admin/db')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const [{ data: rows, error }, { count }] = await Promise.all([
    supabase.from(tableName).select('*').range(from, to).order('id' as never),
    supabase.from(tableName).select('*', { count: 'exact', head: true }),
  ])

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)
  const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : []

  return (
    <TableExplorer
      tables={TABLES}
      selectedTable={tableName}
      columns={columns}
      rows={rows || []}
      totalRows={count || 0}
      page={page}
      totalPages={totalPages}
      error={error?.message}
    />
  )
}
