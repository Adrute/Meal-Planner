import { Resend } from 'resend'

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? 'claudrian1992@gmail.com'

export async function sendBonoAgotadoEmail(serviceName: string, totalSessions: number, amountPaid: number) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY no configurada, email no enviado.')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data, error } = await resend.emails.send({
    from: 'Family Dashboard <onboarding@resend.dev>',
    to: NOTIFY_EMAIL,
    subject: `🔴 Bono agotado: ${serviceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
        <h2 style="color: #0f172a; margin: 0 0 8px;">Bono agotado</h2>
        <p style="color: #64748b; margin: 0 0 24px;">Se han consumido todas las sesiones del siguiente bono:</p>

        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
          <p style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 8px;">${serviceName}</p>
          <p style="color: #64748b; margin: 0 0 4px;">Sesiones totales: <strong>${totalSessions}</strong></p>
          <p style="color: #64748b; margin: 0;">Importe pagado: <strong>${Number(amountPaid).toFixed(2)} €</strong></p>
        </div>

        <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
          Accede a <strong>Family Dashboard → Bonos</strong> para renovarlo cuando quieras.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[Email] Error al enviar notificación de bono agotado:', error)
  } else {
    console.log('[Email] Notificación enviada correctamente. ID:', data?.id)
  }
}
