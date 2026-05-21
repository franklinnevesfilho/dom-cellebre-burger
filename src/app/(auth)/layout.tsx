export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      {children}
    </div>
  )
}
