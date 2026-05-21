import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0]
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: storeCount },
    { count: checklistCount },
    { count: sessionCount },
    { count: employeeCount },
  ] = await Promise.all([
    supabase.from('stores').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('checklists').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('checklist_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_date', getTodayUTC()),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'employee')
      .eq('is_active', true)
      .is('deleted_at', null),
  ])

  const tiles = [
    {
      href: '/admin/stores',
      icon: '🏪',
      title: 'Manage Stores',
      description: 'Restaurant locations and settings',
      count: storeCount ?? 0,
      countLabel: (n: number) => `${n} active store${n !== 1 ? 's' : ''}`,
    },
    {
      href: '/admin/employees',
      icon: '👥',
      title: 'Manage Employees',
      description: 'Invite and manage employee accounts',
      count: employeeCount ?? 0,
      countLabel: (n: number) => `${n} active employee${n !== 1 ? 's' : ''}`,
    },
    {
      href: '/admin/checklists',
      icon: '✅',
      title: 'Manage Checklists',
      description: 'Create and manage opening checklists',
      count: checklistCount ?? 0,
      countLabel: (n: number) => `${n} active checklist${n !== 1 ? 's' : ''}`,
    },
    {
      href: '/admin/reports',
      icon: '📊',
      title: 'View Reports',
      description: 'Completion reports and audit trails',
      count: sessionCount ?? 0,
      countLabel: (n: number) => `${n} session${n !== 1 ? 's' : ''} today`,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-stone-400 mt-1">
          Welcome back. Manage your stores, checklists, and reports from here.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group bg-stone-900 border border-stone-800 rounded-xl p-6 hover:border-amber-500/50 hover:bg-stone-800 transition-all"
          >
            <span className="text-3xl mb-3 block">{tile.icon}</span>
            <h2 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
              {tile.title}
            </h2>
            <p className="text-stone-400 text-sm mt-1">{tile.description}</p>
            <p className="text-amber-500 text-sm font-semibold mt-3">
                {tile.countLabel(tile.count)}
              </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
