import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'convLens - CNN Visualization Tool',
  description: 'Interactive CNN visualization and analysis platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

