'use client'

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">CNN Lens</h3>
            <p className="text-sm text-gray-600">
              Visualize and understand how CNNs see and interpret images.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#models" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Models
                </a>
              </li>
              <li>
                <a href="#get-started" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Get Started
                </a>
              </li>
            </ul>
          </div>


          {/* About */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">About</h4>
            <p className="text-sm text-gray-600 mb-4">
              Built with Next.js + FastAPI
            </p>
            <button
              onClick={scrollToTop}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Back to top ↑
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <p className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} CNN Lens. Built for learning CNN interpretability.
          </p>
        </div>
      </div>
    </footer>
  )
}
