import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CNN Lens — Grad-CAM & Feature Map Visualizer',
  description: 'Upload an image to visualize CNN feature maps and Grad-CAM heatmaps across popular models. Compare layers and predictions in seconds.',
  openGraph: {
    title: 'CNN Lens — Grad-CAM & Feature Map Visualizer',
    description: 'Upload an image to visualize CNN feature maps and Grad-CAM heatmaps across popular models. Compare layers and predictions in seconds.',
    url: 'https://convlens.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CNN Lens — Grad-CAM & Feature Map Visualizer',
    description: 'Upload an image to visualize CNN feature maps and Grad-CAM heatmaps across popular models. Compare layers and predictions in seconds.',
  },
  alternates: {
    canonical: 'https://convlens.com',
  },
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

