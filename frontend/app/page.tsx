'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ModelsDashboardPromo from '@/components/landing/ModelsDashboardPromo'
import RunInferenceSection from '@/components/landing/RunInferenceSection'
import { createJob, getModels, Model } from '@/lib/api'

const HOW_STEPS = [
  {
    title: 'Upload Image',
    desc: 'Upload any image you want to analyze.',
    icon: (
      <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    ),
  },
  {
    title: 'CNN Processing',
    desc: 'The CNN extracts features through multiple layers.',
    icon: (
      <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
        <circle cx="7" cy="8.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="17" cy="8.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="7" cy="18" r="1" fill="currentColor" stroke="none" />
        <circle cx="17" cy="18" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: 'Visualization',
    desc: 'Explore feature maps and Grad-CAM heatmaps.',
    icon: (
      <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v14H4V5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M12 5v14" opacity={0.5} />
        <circle cx="9" cy="9" r="1.5" fill="currentColor" />
        <circle cx="15" cy="15" r="2" fill="currentColor" opacity={0.6} />
      </svg>
    ),
  },
  {
    title: 'Prediction',
    desc: 'View the final prediction with confidence scores.',
    icon: (
      <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
]

export default function Home() {
  const router = useRouter()
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [modelsError, setModelsError] = useState<string | null>(null)

  const featuresRef = useRef<HTMLDivElement>(null)
  const modelsRef = useRef<HTMLDivElement>(null)
  const uploadSectionRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)

  const fetchModels = async () => {
    setIsLoadingModels(true)
    setModelsError(null)
    try {
      const modelsData = await getModels()
      setModels(modelsData)
    } catch (err) {
      console.error('Failed to fetch models:', err)
      setModelsError('Could not load models.')
    } finally {
      setIsLoadingModels(false)
    }
  }

  useEffect(() => {
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
      tags: ['Fast', 'Lightweight', '18 layers'],
    },
    resnet50: {
      description: 'Deeper network with improved accuracy for complex patterns.',
      tags: ['Accurate', 'Deep', '50 layers'],
    },
    vgg16: {
      description: 'Classic architecture, great for learning CNN structure.',
      tags: ['Classic', 'Well-studied', '16 layers'],
    },
  }

  const gridPattern = {
    backgroundImage: `
      repeating-linear-gradient(0deg, rgba(99, 102, 241, 0.06) 0px, transparent 1px, transparent 40px, rgba(99, 102, 241, 0.06) 41px),
      repeating-linear-gradient(90deg, rgba(99, 102, 241, 0.06) 0px, transparent 1px, transparent 40px, rgba(99, 102, 241, 0.06) 41px)
    `,
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        onScrollToFeatures={scrollToFeatures}
        onScrollToModels={scrollToModels}
        onScrollToGetStarted={scrollToUpload}
        onScrollToHowItWorks={scrollToHowItWorks}
      />

      <main>
        {/* Hero */}
        <section className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center overflow-hidden bg-white px-4 py-8 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50" style={gridPattern}>
            <div className="absolute left-0 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/20 blur-3xl" />
            <div className="absolute right-0 top-1/2 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/15 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 translate-y-1/4 rounded-full bg-purple-400/12 blur-3xl" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" aria-hidden />

          <div className="relative z-[1] mx-auto w-full max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 shadow-sm backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                ConvLens · CNN interpretability
              </p>
              <h1 className="mb-5 text-4xl font-bold leading-tight text-gray-800 md:text-5xl lg:text-6xl">
                Visualize how CNNs transform images into predictions
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl md:leading-relaxed">
                Explore layer-by-layer activations, feature maps, and Grad-CAM visualizations to understand what CNNs learn.
              </p>

              <div className="mx-auto mb-8 h-px max-w-md bg-gradient-to-r from-transparent via-indigo-300/80 to-transparent" aria-hidden />

              <div className="flex flex-col justify-center gap-4 sm:flex-row sm:justify-center sm:gap-4">
                <button
                  type="button"
                  onClick={scrollToUpload}
                  className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl hover:shadow-violet-400/50 active:scale-[0.98] md:text-lg"
                >
                  Try Demo
                </button>
                <button
                  type="button"
                  onClick={scrollToHowItWorks}
                  className="rounded-lg border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-md md:text-lg"
                >
                  Learn How It Works
                </button>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-700">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-5 w-5 flex-shrink-0 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Layer activations
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-5 w-5 flex-shrink-0 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Grad-CAM heatmaps
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-5 w-5 flex-shrink-0 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Prediction breakdown
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section ref={howItWorksRef} className="scroll-mt-20 bg-zinc-50/50 py-16 dark:bg-zinc-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl">How It Works</h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600">
                Understand the process from image upload to visualization
              </p>
            </div>

            <div className="flex flex-col gap-10 md:hidden">
              {HOW_STEPS.map((step, idx) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Step {idx + 1}</p>
                    <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                    <p className="mt-1 text-base leading-relaxed text-gray-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:flex md:items-start md:justify-between md:gap-2">
              {HOW_STEPS.flatMap((step, idx) => [
                <div key={step.title} className="flex min-w-0 flex-1 flex-col items-center px-1 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg">
                    {step.icon}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Step {idx + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-gray-600">{step.desc}</p>
                </div>,
                idx < HOW_STEPS.length - 1 ? (
                  <div
                    key={`conn-${idx}`}
                    className="mt-10 hidden h-0.5 w-6 flex-shrink-0 self-start border-0 border-t-2 border-dashed border-indigo-300 bg-transparent md:block lg:w-10"
                    aria-hidden
                  />
                ) : null,
              ])}
            </div>
          </div>
        </section>

        {/* What You'll See */}
        <section ref={featuresRef} id="features" className="scroll-mt-20 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl">What You&apos;ll See</h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600">
                Explore every layer of a CNN&apos;s decision-making process
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md hover:shadow-violet-400/10">
                <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-slate-100">
                  <div className="grid h-full grid-cols-2 grid-rows-2 gap-1 p-1">
                    <div className="rounded-sm bg-gradient-to-br from-amber-400 to-rose-500" />
                    <div className="rounded-sm bg-gradient-to-br from-cyan-400 to-indigo-600" />
                    <div className="rounded-sm bg-gradient-to-br from-emerald-400 to-teal-600" />
                    <div className="rounded-sm bg-gradient-to-br from-violet-400 to-fuchsia-600" />
                  </div>
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                    />
                  </svg>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Feature Maps</h3>
                <p className="leading-relaxed text-gray-600">
                  See what each layer focuses on as the network processes your image through different levels of abstraction.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md hover:shadow-violet-400/10">
                <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-slate-900/5">
                  <img
                    src="/imgs/cat_gradcam.png"
                    alt="Example Grad-CAM heatmap visualization"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-violet-200">
                  <svg className="h-6 w-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="heatmapGradCard" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                        <stop offset="50%" stopColor="currentColor" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    <rect x="3" y="3" width="18" height="18" rx="2" fill="url(#heatmapGradCard)" stroke="currentColor" strokeWidth="2" />
                    <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                    <circle cx="15" cy="9" r="1.5" fill="currentColor" />
                    <circle cx="9" cy="15" r="1.5" fill="currentColor" />
                    <circle cx="15" cy="15" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Grad-CAM</h3>
                <p className="leading-relaxed text-gray-600">
                  Understand why the model predicted that class with heatmap visualizations showing the most important regions.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md hover:shadow-violet-400/10">
                <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-slate-50 p-4">
                  <div className="flex h-full flex-col justify-center gap-2">
                    <div className="h-2.5 w-full max-w-full rounded bg-zinc-200">
                      <div className="h-full w-[94%] rounded bg-indigo-600" />
                    </div>
                    <div className="h-2.5 w-full max-w-full rounded bg-zinc-200">
                      <div className="h-full w-[4%] rounded bg-violet-500" />
                    </div>
                    <div className="h-2.5 w-full max-w-full rounded bg-zinc-200">
                      <div className="h-full w-[2%] rounded bg-amber-500" />
                    </div>
                  </div>
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-purple-200">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Prediction Breakdown</h3>
                <p className="leading-relaxed text-gray-600">
                  Track confidence scores and explore the top predicted classes with detailed probability breakdowns.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Example CNN Explanation */}
        <section className="scroll-mt-20 bg-zinc-50/50 py-20 dark:bg-zinc-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl">Example CNN Explanation</h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600">
                See how a CNN transforms an image: from the original photo, through Grad-CAM heatmaps, to the final overlay visualization.
              </p>
            </div>

            <div className="mx-auto max-w-6xl">
              <div className="rounded-2xl border border-gray-200/50 bg-white p-8 shadow-2xl md:p-12 lg:p-16">
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  Saved example · ResNet-50
                </div>

                <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
                  <div>
                    <div className="mb-3 text-center text-xs font-semibold text-gray-600 md:text-left">Step 1: Original</div>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-slate-50 shadow-md">
                      <div className="absolute left-2 top-2 z-10 rounded-full bg-black/70 px-2.5 py-1 backdrop-blur-sm">
                        <span className="text-xs font-semibold text-white">Original</span>
                      </div>
                      <img
                        src="/imgs/cat.png"
                        alt="Original image"
                        className="h-full w-full object-contain"
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          if (target.parentElement) {
                            target.parentElement.innerHTML =
                              '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">Demo Image</div>'
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 text-center text-xs font-semibold text-gray-600 md:text-left">Step 2: Overlay</div>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-slate-50 shadow-md">
                      <div className="absolute left-2 top-2 z-10 rounded-full bg-black/70 px-2.5 py-1 backdrop-blur-sm">
                        <span className="text-xs font-semibold text-white">Overlay</span>
                      </div>
                      <img
                        src="/imgs/overlay.png"
                        alt="Grad-CAM overlay"
                        className="h-full w-full object-contain"
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          if (target.parentElement) {
                            target.parentElement.innerHTML =
                              '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">Overlay</div>'
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 text-center text-xs font-semibold text-gray-600 md:text-left">Step 3: Grad-CAM</div>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-slate-50 shadow-md">
                      <div className="absolute left-2 top-2 z-10 rounded-full bg-black/70 px-2.5 py-1 backdrop-blur-sm">
                        <span className="text-xs font-semibold text-white">Grad-CAM</span>
                      </div>
                      <img
                        src="/imgs/cat_gradcam.png"
                        alt="Grad-CAM heatmap"
                        className="h-full w-full object-contain"
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          if (target.parentElement) {
                            target.parentElement.innerHTML =
                              '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">Grad-CAM</div>'
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-indigo-200/50 bg-gradient-to-r from-indigo-50 to-violet-50 p-6">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">Prediction</div>
                    <div className="truncate text-base font-semibold text-gray-900 md:text-lg">Cat</div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-lg font-bold text-white shadow-md md:text-xl">
                      94.2%
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <a
                    href="#get-started"
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    Try this with your own image
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ModelsDashboardPromo />

        <RunInferenceSection
          modelsRef={modelsRef}
          uploadSectionRef={uploadSectionRef}
          models={models}
          modelInfo={modelInfo}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          isLoadingModels={isLoadingModels}
          modelsError={modelsError}
          onRetryModels={fetchModels}
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
          onAnalyze={handleAnalyze}
          isSubmitting={isSubmitting}
          jobError={error}
        />
      </main>

      <Footer />
    </div>
  )
}
