import { createClient } from '@/lib/supabase/server'

export type DashboardAlert = {
  type: 'warning'
  title: string
  message: string
  href: string
}

const MARKET_THRESHOLD = 0.16

const madridDate = (d: Date = new Date()) =>
  d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })

export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  const supabase = await createClient()
  const today = madridDate()
  const in48h = madridDate(new Date(Date.now() + 48 * 60 * 60 * 1000))

  const [{ data: exhaustedPasses }, { data: latestInvoices }, { data: upcomingTrips }] = await Promise.all([
    supabase.from('service_passes').select('id, service_name, used_sessions, total_sessions'),
    supabase.from('home_invoices').select('elec_amount, elec_kwh, issue_date').order('issue_date', { ascending: false }).limit(1),
    supabase.from('trips').select('id, title, destination, start_date').gt('start_date', today).lte('start_date', in48h),
  ])

  const alerts: DashboardAlert[] = []

  for (const pass of (exhaustedPasses ?? []).filter(p => p.used_sessions >= p.total_sessions)) {
    alerts.push({
      type: 'warning',
      title: 'Bono agotado',
      message: `${pass.service_name} no tiene sesiones disponibles. Renuévalo cuando quieras.`,
      href: '/services',
    })
  }

  const latestInvoice = latestInvoices?.[0]
  if (latestInvoice && latestInvoice.elec_kwh > 0) {
    const pricePerKwh = Number(latestInvoice.elec_amount) / Number(latestInvoice.elec_kwh)
    if (pricePerKwh > MARKET_THRESHOLD) {
      alerts.push({
        type: 'warning',
        title: 'Revisa tu tarifa de Luz',
        message: `Estás pagando la luz a ${pricePerKwh.toFixed(3)} €/kWh. El mercado ronda los ${MARKET_THRESHOLD} €. Podrías estar pagando de más.`,
        href: '/utilities',
      })
    }
  }

  for (const trip of upcomingTrips ?? []) {
    alerts.push({
      type: 'warning',
      title: 'Viaje a punto de empezar',
      message: `${trip.title || trip.destination} empieza el ${new Date(trip.start_date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}.`,
      href: '/trips',
    })
  }

  return alerts
}
