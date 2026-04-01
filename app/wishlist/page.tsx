import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Gift } from 'lucide-react'
import WishlistUI from './wishlist-ui'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: items },
    { data: allProfiles },
    { data: shareRecords },
    { data: sharedItems },
  ] = await Promise.all([
    supabase.rpc('get_my_wishlist_items'),
    supabase.from('profiles').select('id, email, display_name').neq('id', user.id),
    supabase.rpc('get_item_shares', { p_user_id: user.id }),
    supabase.rpc('get_items_shared_with_me'),
  ])

  // perfiles de los dueños de items compartidos conmigo
  const ownerIds = [...new Set((sharedItems || []).map((i: { user_id: string }) => i.user_id))]
  const { data: ownerProfiles } = ownerIds.length > 0
    ? await supabase.from('profiles').select('id, email, display_name').in('id', ownerIds)
    : { data: [] }

  // mapa itemId → [userId, ...]
  const itemShares: Record<string, string[]> = {}
  for (const s of (shareRecords || [])) {
    if (!itemShares[s.item_id]) itemShares[s.item_id] = []
    itemShares[s.item_id].push(s.shared_with_user_id)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 pb-24 md:pb-10 space-y-8 animate-in fade-in">
      <header>
        <div className="flex items-center gap-3 mb-1">
          <Gift size={28} className="text-pink-500" />
          <h1 className="text-3xl font-black text-slate-900">Lista de deseos</h1>
        </div>
        <p className="text-sm text-slate-400 ml-10">
          Cosas que quieres. Comparte con familia o por WhatsApp.
        </p>
      </header>

      <WishlistUI
        items={items || []}
        userId={user.id}
        profiles={allProfiles || []}
        itemShares={itemShares}
        sharedWithMe={sharedItems || []}
        ownerProfiles={ownerProfiles || []}
      />
    </div>
  )
}
