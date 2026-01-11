'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ModelSelector from '@/components/ModelSelector'
import UploadDropzone from '@/components/UploadDropzone'
import { createJob } from '@/lib/api'

export default function Home() {
  const router = useRouter()
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!selectedFile || !selectedModel) {
      setError('Please select both an image and a model')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const jobResponse = await createJob(selectedFile, selectedModel)
      // Navigate to viewer page with job ID
      router.push(`/viewer/${jobResponse.job_id}`)
    } catch (err) {
      console.error('Failed to create job:', err)
      setError(err instanceof Error ? err.message : 'Failed to create job. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            CNN Lens
          </h1>
          <p className="text-lg text-gray-600">
            Upload an image to visualize CNN layer activations and feature maps
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <UploadDropzone
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
          />

          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || !selectedModel || isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
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
                Creating job...
              </>
            ) : (
              'Analyze'
            )}
          </button>
        </div>
      </div>
    </main>
  )
}
