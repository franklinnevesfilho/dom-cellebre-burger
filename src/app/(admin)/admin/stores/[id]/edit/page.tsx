import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditStoreForm from './EditStoreForm'

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: store } = await supabase.from('stores').select('*').eq('id', id).single()

  if (!store) notFound()

  return (
    <div className="max-w-lg">
      <EditStoreForm store={store} />
    </div>
  )
}
