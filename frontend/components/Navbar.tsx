'use client'

import Link from 'next/link'

interface NavbarProps {
  onScrollToFeatures: () => void
  onScrollToModels: () => void
  onScrollToGetStarted: () => void
  onScrollToHowItWorks: () => void
}

export default function Navbar({
  onScrollToFeatures,
  onScrollToModels,
  onScrollToGetStarted,
  onScrollToHowItWorks,
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {/* Custom Logo SVG: Lens + Convolution Grid */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                {/* Outer lens ring */}
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" className="text-indigo-600" fill="none" />
                {/* Inner lens circle */}
                <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.5" className="text-violet-600" fill="none" />
                {/* Convolution grid dots (3x3 pattern in center) */}
                <circle cx="12" cy="12" r="1.5" fill="currentColor" className="text-indigo-600" />
                <circle cx="16" cy="12" r="1.5" fill="currentColor" className="text-indigo-600" />
                <circle cx="20" cy="12" r="1.5" fill="currentColor" className="text-indigo-600" />
                <circle cx="12" cy="16" r="1.5" fill="currentColor" className="text-indigo-600" />
                <circle cx="16" cy="16" r="1.5" fill="currentColor" className="text-violet-600" />
                <circle cx="20" cy="16" r="1.5" fill="currentColor" className="text-indigo-600" />
                <circle cx="12" cy="20" r="1.5" fill="currentColor" className="text-indigo-600" />
                <circle cx="16" cy="20" r="1.5" fill="currentColor" className="text-indigo-600" />
                <circle cx="20" cy="20" r="1.5" fill="currentColor" className="text-indigo-600" />
              </svg>
              <span className="text-xl font-bold text-gray-900">convLens</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={onScrollToFeatures}
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Features
            </button>
            <button
              onClick={onScrollToModels}
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Models
            </button>
            <Link
              href="/models"
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Compare Models
            </Link>
            <button
              onClick={onScrollToGetStarted}
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={onScrollToHowItWorks}
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              How it works
            </button>
            <a
              href="https://github.com/AhmedKamal-41/cnn-layer-visualizer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="View source on GitHub"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.07.78 2.16 0 1.56-.01 2.81-.01 3.19 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5z" />
              </svg>
              GitHub
            </a>
            <button
              onClick={onScrollToGetStarted}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-violet-400/50 transition-all duration-200"
            >
              Try Demo
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={onScrollToGetStarted}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all duration-200"
            >
              Try Demo
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
