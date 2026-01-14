'use client'

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
