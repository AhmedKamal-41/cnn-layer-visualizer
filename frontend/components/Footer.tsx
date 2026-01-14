'use client'

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900">convLens</h3>
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
              Visualize and understand how CNNs see and interpret images.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#features" 
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors inline-block"
                >
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="#models" 
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors inline-block"
                >
                  Models
                </a>
              </li>
              <li>
                <a 
                  href="#get-started" 
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors inline-block"
                >
                  Get Started
                </a>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">About</h4>
            <p className="text-sm text-gray-600 mb-4">
              Built with Next.js + FastAPI
            </p>
            <button
              onClick={scrollToTop}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-1 -ml-1"
            >
              Back to top ↑
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12 pt-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} convLens. Built for learning CNN interpretability.
          </p>
        </div>
      </div>
    </footer>
  )
}
