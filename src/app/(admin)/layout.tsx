'use client'

import { signOut } from '@/app/actions/auth'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/stores', label: 'Stores' },
  { href: '/admin/employees', label: 'Employees' },
  { href: '/admin/checklists', label: 'Checklists' },
  { href: '/admin/reports', label: 'Reports' },
]

function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-stone-900 border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="text-xl">🍔</span>
            <span className="font-bold text-white text-sm tracking-tight">
              Dom Cellebre{' '}
              <span className="text-amber-500 font-normal">Admin</span>
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-stone-800 text-white'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={() => signOut()}
            className="text-sm text-stone-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-stone-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
