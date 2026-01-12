'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import UploadDropzone from '@/components/UploadDropzone'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createJob, getModels, Model } from '@/lib/api'

export default function Home() {
  const router = useRouter()
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [models, setModels] = useState<Model[]>([])

  const featuresRef = useRef<HTMLDivElement>(null)
  const modelsRef = useRef<HTMLDivElement>(null)
  const uploadSectionRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const modelsData = await getModels()
        setModels(modelsData)
      } catch (err) {
        console.error('Failed to fetch models:', err)
      }
    }
    fetchModels()
  }, [])

  const handleAnalyze = async () => {
    if (!selectedFile || !selectedModel) {
      setError('Please select both an image and a model')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const jobResponse = await createJob(selectedFile, selectedModel)
      router.push(`/viewer/${jobResponse.job_id}`)
    } catch (err) {
      console.error('Failed to create job:', err)
      setError(err instanceof Error ? err.message : 'Failed to create job. Please try again.')
      setIsSubmitting(false)
    }
  }

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToModels = () => {
    modelsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToUpload = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const modelInfo: Record<string, { description: string; tags: string[] }> = {
    resnet18: {
      description: 'Lightweight and efficient, perfect for quick experiments.',
      tags: ['Fast', 'Lightweight', '18 layers']
    },
    resnet50: {
      description: 'Deeper network with improved accuracy for complex patterns.',
      tags: ['Accurate', 'Deep', '50 layers']
    },
    vgg16: {
      description: 'Classic architecture, great for learning CNN structure.',
      tags: ['Classic', 'Well-studied', '16 layers']
    }
  }

  const selectedModelData = models.find((m: Model) => m.id === selectedModel)
  const selectedModelInfo = selectedModelData ? modelInfo[selectedModelData.id] : null

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        onScrollToFeatures={scrollToFeatures}
        onScrollToModels={scrollToModels}
        onScrollToGetStarted={scrollToUpload}
        onScrollToHowItWorks={scrollToHowItWorks}
      />

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 md:py-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Column */}
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Visualize how CNNs transform images into predictions
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                  Explore layer-by-layer activations, feature maps, and Grad-CAM visualizations to understand what CNNs learn.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <button
                    onClick={scrollToUpload}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    Try Demo
                  </button>
                  <button
                    onClick={scrollToHowItWorks}
                    className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
                  >
                    Learn How It Works
                  </button>
                </div>

                {/* Quick bullets */}
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Layer activations</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Grad-CAM heatmaps</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Prediction breakdown</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Product Preview Mock */}
              <div className="hidden md:block">
                <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
                  {/* Mock layer visualization */}
                  <div className="space-y-4">
                    {/* Layer chips */}
                    <div className="flex gap-2 flex-wrap">
                      {['conv1', 'layer1', 'layer2', 'layer3', 'layer4'].map((layer, idx) => (
                        <div
                          key={layer}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                        >
                          {layer}
                        </div>
                      ))}
                    </div>

                    {/* Mock graph/visualization */}
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="space-y-3">
                        {/* Mock bars/channels */}
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-16 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded" style={{ width: `${60 + i * 8}%` }}></div>
                            <div className="text-xs text-gray-500 w-8">Ch{i}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mock prediction */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Prediction</div>
                        <div className="text-xs text-gray-600">Golden Retriever</div>
                      </div>
                      <div className="text-lg font-bold text-blue-600">94.2%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} id="features" className="py-10 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What You'll See
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore every layer of a CNN's decision-making process
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature Map Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Feature Maps</h3>
                <p className="text-gray-600 leading-relaxed">
                  See what each layer focuses on as the network processes your image through different levels of abstraction.
                </p>
              </div>

              {/* Grad-CAM Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Grad-CAM</h3>
                <p className="text-gray-600 leading-relaxed">
                  Understand why the model predicted that class with heatmap visualizations showing the most important regions.
                </p>
              </div>

              {/* Prediction Breakdown Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Prediction Breakdown</h3>
                <p className="text-gray-600 leading-relaxed">
                  Track confidence scores and explore the top predicted classes with detailed probability breakdowns.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Models Section */}
        <section ref={modelsRef} id="models" className="py-10 md:py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Choose a Model
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Select a pre-trained CNN model to analyze your images
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {models.map((model: Model) => {
                const info = modelInfo[model.id] || {
                  description: 'A powerful deep learning model for image classification.',
                  tags: ['Pre-trained', 'ImageNet']
                }
                const isSelected = selectedModel === model.id

                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`
                      relative text-left bg-white rounded-xl p-6 border-2 transition-all
                      ${isSelected
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 pr-8">{model.display_name}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{info.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {info.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Get Started Section */}
        <section ref={uploadSectionRef} id="get-started" className="py-10 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Get Started
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload an image and analyze it with your selected model
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left: Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Image</h3>
                  <UploadDropzone
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                  />
                </div>

                {/* Right: Model Summary + Analyze */}
                <div className="space-y-4">
                  {/* Selected Model Summary */}
                  {selectedModelData && selectedModelInfo ? (
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Selected Model</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">{selectedModelData.display_name}</span>
                          <span className="text-sm text-gray-600">{selectedModelData.input_size.join(' × ')} px</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{selectedModelInfo.description}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <p className="text-sm text-gray-600">No model selected. Choose a model above to continue.</p>
                    </div>
                  )}

                  {/* Analyze Button */}
                  <button
                    onClick={handleAnalyze}
                    disabled={!selectedFile || !selectedModel || isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Image'
                    )}
                  </button>

                  {/* Validation helper */}
                  {(!selectedFile || !selectedModel) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800">
                        <strong>Required:</strong> Please select both an image and a model to analyze.
                      </p>
                    </div>
                  )}

                  {/* Error Alert */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section ref={howItWorksRef} className="py-10 md:py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Understand the process from image upload to visualization
              </p>
            </div>

            <div className="relative">
              {/* Desktop: Horizontal timeline */}
              <div className="hidden md:grid md:grid-cols-4 gap-6">
                {[
                  { num: 1, title: 'Upload Image', desc: 'Upload any image you want to analyze.' },
                  { num: 2, title: 'CNN Processing', desc: 'The CNN extracts features through multiple layers.' },
                  { num: 3, title: 'Visualization', desc: 'Explore feature maps and Grad-CAM heatmaps.' },
                  { num: 4, title: 'Prediction', desc: 'View the final prediction with confidence scores.' },
                ].map((step, idx) => (
                  <div key={step.num} className="relative">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 relative z-10">
                        {step.num}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                    {/* Connector line */}
                    {idx < 3 && (
                      <div className="absolute top-8 left-full w-full h-0.5 bg-gray-300 transform translate-x-3" style={{ width: 'calc(100% - 3rem)' }}></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile: Vertical stack */}
              <div className="md:hidden space-y-8">
                {[
                  { num: 1, title: 'Upload Image', desc: 'Upload any image you want to analyze.' },
                  { num: 2, title: 'CNN Processing', desc: 'The CNN extracts features through multiple layers.' },
                  { num: 3, title: 'Visualization', desc: 'Explore feature maps and Grad-CAM heatmaps.' },
                  { num: 4, title: 'Prediction', desc: 'View the final prediction with confidence scores.' },
                ].map((step, idx) => (
                  <div key={step.num} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                        {step.num}
                      </div>
                      {idx < 3 && (
                        <div className="w-0.5 h-8 bg-gray-300 mx-auto mt-2"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
