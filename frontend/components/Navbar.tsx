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
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              CNN Lens
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={onScrollToFeatures}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Features
            </button>
            <button
              onClick={onScrollToModels}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Models
            </button>
            <button
              onClick={onScrollToGetStarted}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={onScrollToHowItWorks}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              How it works
            </button>
            <button
              onClick={onScrollToGetStarted}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Demo
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={onScrollToGetStarted}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Demo
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

