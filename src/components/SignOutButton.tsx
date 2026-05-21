'use client'

import { signOut } from '@/app/actions/auth'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="text-sm text-stone-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-stone-800"
    >
      Sign out
    </button>
  )
}
