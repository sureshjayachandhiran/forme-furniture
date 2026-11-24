
import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = {
  title: 'FORME – Considered design. Beautiful living.',
  description:
    'Thoughtfully curated furniture, lighting, and objects for a home that feels like you.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-950 antialiased">
        {children}
      </body>
    </html>
  )
}
