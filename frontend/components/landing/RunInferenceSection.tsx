'use client'

import type { MutableRefObject, RefObject } from 'react'
import UploadDropzone from '@/components/UploadDropzone'
import { Model } from '@/lib/api'

export type ModelInfoMap = Record<string, { description: string; tags: string[] }>

export interface RunInferenceSectionProps {
  modelsRef: RefObject<HTMLDivElement | null>
  uploadSectionRef: RefObject<HTMLDivElement | null>
  models: Model[]
  modelInfo: ModelInfoMap
  selectedModel: string | null
  onSelectModel: (id: string) => void
  isLoadingModels: boolean
  modelsError: string | null
  onRetryModels: () => void
  selectedFile: File | null
  onFileSelect: (file: File | null) => void
  onAnalyze: () => void
  isSubmitting: boolean
  jobError: string | null
}

function mergeRefs(
  node: HTMLElement | null,
  a: RefObject<HTMLDivElement | null>,
  b: RefObject<HTMLDivElement | null>
) {
  const el = node as HTMLDivElement | null
  ;(a as MutableRefObject<HTMLDivElement | null>).current = el
  ;(b as MutableRefObject<HTMLDivElement | null>).current = el
}

export default function RunInferenceSection({
  modelsRef,
  uploadSectionRef,
  models,
  modelInfo,
  selectedModel,
  onSelectModel,
  isLoadingModels,
  modelsError,
  onRetryModels,
  selectedFile,
  onFileSelect,
  onAnalyze,
  isSubmitting,
  jobError,
}: RunInferenceSectionProps) {
  const selectedModelData = models.find((m) => m.id === selectedModel)
  const selectedInfo = selectedModelData ? modelInfo[selectedModelData.id] : null
  const canAnalyze = Boolean(selectedFile && selectedModel && !isSubmitting)

  return (
    <section
      id="get-started"
      ref={(node) => mergeRefs(node, modelsRef, uploadSectionRef)}
      className="scroll-mt-20 bg-zinc-50/50 py-24 dark:bg-zinc-950"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold text-gray-800 md:text-4xl">Try it yourself</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Pick a model, upload an image, then run analysis in one step
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg md:p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
            {/* Left: models */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Choose a model</h3>
              {isLoadingModels ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                      <div className="mt-3 h-3 w-full max-w-xs animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  ))}
                </div>
              ) : modelsError ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
                  <p className="text-sm text-amber-900">{modelsError}</p>
                  <button
                    type="button"
                    onClick={onRetryModels}
                    className="mt-3 text-sm font-medium text-amber-800 underline hover:text-amber-950"
                  >
                    Retry
                  </button>
                </div>
              ) : models.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 py-8 text-center">
                  <p className="text-sm text-gray-600">No models available. Check your backend connection.</p>
                </div>
              ) : (
                <div className="flex max-h-[min(420px,50vh)] flex-col gap-3 overflow-y-auto pr-1 md:max-h-none md:overflow-visible">
                  {models.map((model) => {
                    const info = modelInfo[model.id] || {
                      description: 'A powerful deep learning model for image classification.',
                      tags: ['Pre-trained', 'ImageNet'],
                    }
                    const isSelected = selectedModel === model.id
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => onSelectModel(model.id)}
                        className={`relative rounded-xl border-2 bg-white p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-violet-200'
                            : 'border-gray-200 hover:border-indigo-200 hover:shadow-sm'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md">
                            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <h4 className="pr-8 text-lg font-bold text-gray-900">{model.display_name}</h4>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600">{info.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {info.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right: upload */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Upload image</h3>
              <UploadDropzone onFileSelect={onFileSelect} selectedFile={selectedFile} />
            </div>
          </div>

          {selectedModelData && selectedInfo && (
            <div className="mt-8 rounded-xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">Selected model</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedModelData.display_name}</p>
                  <p className="mt-1 text-sm text-gray-700">{selectedInfo.description}</p>
                </div>
                <span className="text-sm text-gray-600">{selectedModelData.input_size.join(' × ')} px</span>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={onAnalyze}
              disabled={!canAnalyze}
              className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-4 px-6 text-lg font-semibold text-white transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl hover:shadow-violet-400/50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:hover:shadow-none active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Analyzing...
                </>
              ) : (
                'Analyze Image'
              )}
            </button>

            {!isLoadingModels &&
              !modelsError &&
              models.length > 0 &&
              (!selectedFile || !selectedModel) &&
              !isSubmitting && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Required:</strong> Select a model and an image to analyze.
                  </p>
                </div>
              )}

            {jobError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex">
                  <svg className="h-5 w-5 flex-shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="ml-3 text-sm text-red-800">{jobError}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
