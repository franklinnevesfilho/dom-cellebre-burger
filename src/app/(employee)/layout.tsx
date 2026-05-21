import { getProfile } from '@/lib/auth/getProfile'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/SignOutButton'

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  let storeName = 'No Store'
  if (profile?.store_id) {
    const supabase = await createClient()
    const { data: store } = await supabase
      .from('stores')
      .select('name')
      .eq('id', profile.store_id)
      .single()
    storeName = store?.name ?? 'Unknown Store'
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <nav className="bg-stone-900 border-b border-stone-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <span className="text-lg">🍔</span>
              <span className="font-semibold text-white text-sm">
                Dom Cellebre
              </span>
              <span className="text-stone-600 text-sm">·</span>
              <span className="text-stone-400 text-sm">{storeName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-stone-400 text-sm hidden sm:block">
                {profile?.full_name ?? 'Staff Member'}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
