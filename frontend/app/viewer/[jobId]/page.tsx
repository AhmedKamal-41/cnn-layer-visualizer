'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import JobStatusBanner from '@/components/JobStatusBanner'
import NetworkGraph from '@/components/NetworkGraph'
import LayerPicker from '@/components/LayerPicker'
import VisualizationCanvas from '@/components/VisualizationCanvas'
import LayerInfoPanel from '@/components/LayerInfoPanel'
import FeatureMapGrid from '@/components/FeatureMapGrid'
import HeatmapOverlay from '@/components/HeatmapOverlay'
import ErrorBoundary from '@/components/ErrorBoundary'
import { getJobStatus, JobResponse, createJob, getModels, Model } from '@/lib/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function ViewerPageContent() {
  const params = useParams()
  const jobId = params.jobId as string
  const [job, setJob] = useState<JobResponse | null>(null)
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Compare mode state
  const [compareMode, setCompareMode] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [secondModelId, setSecondModelId] = useState<string | null>(null)
  const [secondJob, setSecondJob] = useState<JobResponse | null>(null)
  const [secondJobError, setSecondJobError] = useState<string | null>(null)
  const secondPollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch models when compare mode is enabled
  useEffect(() => {
    if (!compareMode) return

    const fetchModelsList = async () => {
      try {
        const modelsList = await getModels()
        setModels(modelsList)
      } catch (err) {
        console.error('Failed to fetch models:', err)
      }
    }

    fetchModelsList()
  }, [compareMode])

  // Convert image URL to File for job creation
  const urlToFile = async (url: string): Promise<File> => {
    const fullUrl = url.startsWith('/static/') ? `${API_BASE_URL}${url}` : url
    const response = await fetch(fullUrl)
    const blob = await response.blob()
    const filename = url.split('/').pop() || 'image.png'
    return new File([blob], filename, { type: blob.type || 'image/png' })
  }

  // Create second job when second model is selected
  useEffect(() => {
    if (!compareMode || !secondModelId || !job || job.status !== 'succeeded') return

    const jobData = job as any
    const inputImageUrl = jobData.input?.image_url
    if (!inputImageUrl) return

    const createSecondJob = async () => {
      try {
        setSecondJobError(null)
        const imageFile = await urlToFile(inputImageUrl)
        const newJob = await createJob(imageFile, secondModelId)
        setSecondJob(newJob)
      } catch (err) {
        console.error('Failed to create second job:', err)
        setSecondJobError(err instanceof Error ? err.message : 'Failed to create second job')
      }
    }

    createSecondJob()
  }, [compareMode, secondModelId, job])

  // Poll second job status
  useEffect(() => {
    if (!secondJob || secondJob.status === 'succeeded' || secondJob.status === 'failed') {
      if (secondPollingIntervalRef.current) {
        clearInterval(secondPollingIntervalRef.current)
        secondPollingIntervalRef.current = null
      }
      return
    }

    const fetchSecondJobStatus = async () => {
      try {
        const jobData = await getJobStatus(secondJob.job_id)
        setSecondJob(jobData)

        if (jobData.status === 'succeeded' || jobData.status === 'failed') {
          if (secondPollingIntervalRef.current) {
            clearInterval(secondPollingIntervalRef.current)
            secondPollingIntervalRef.current = null
          }
        }
      } catch (err) {
        console.error('Failed to fetch second job status:', err)
        if (secondPollingIntervalRef.current) {
          clearInterval(secondPollingIntervalRef.current)
          secondPollingIntervalRef.current = null
        }
      }
    }

    secondPollingIntervalRef.current = setInterval(fetchSecondJobStatus, 700)

    return () => {
      if (secondPollingIntervalRef.current) {
        clearInterval(secondPollingIntervalRef.current)
        secondPollingIntervalRef.current = null
      }
    }
  }, [secondJob])

  useEffect(() => {
    const fetchJobStatus = async () => {
      try {
        const jobData = await getJobStatus(jobId)
        setJob(jobData)
        setError(null)

        // Stop polling if job is succeeded or failed
        if (jobData.status === 'succeeded' || jobData.status === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        }
      } catch (err) {
        console.error('Failed to fetch job status:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch job status')
        // Stop polling on error
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    }

    // Initial fetch
    fetchJobStatus()

    // Start polling (will stop automatically when job completes)
    pollingIntervalRef.current = setInterval(fetchJobStatus, 700)

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      if (secondPollingIntervalRef.current) {
        clearInterval(secondPollingIntervalRef.current)
        secondPollingIntervalRef.current = null
      }
    }
  }, [jobId])

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job...</p>
        </div>
      </div>
    )
  }

  if (error && job.status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Job Failed</h2>
          <p className="text-gray-600 mb-4">{job.message || error}</p>
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Helper function to get top-1 prediction
  const getTopPrediction = (jobData: JobResponse | null) => {
    if (!jobData || jobData.status !== 'succeeded') return null
    const data = jobData as any
    const prediction = data.prediction?.topk?.[0]
    return prediction || null
  }

  // Helper function to extract available stages from layers
  const getAvailableStages = (jobData: JobResponse | null): string[] => {
    if (!jobData || jobData.status !== 'succeeded') return []
    const data = jobData as any
    const layers = data.layers || []
    const stages = layers
      .map((l: any) => l.stage)
      .filter((s: string | null) => s !== null && s !== undefined)
      .filter((s: string, index: number, arr: string[]) => arr.indexOf(s) === index) // unique
      .sort()
    return stages
  }

  // Helper function to find layer by stage in a job
  const findLayerByStage = (jobData: JobResponse | null, stage: string | null) => {
    if (!jobData || jobData.status !== 'succeeded' || !stage) return null
    const data = jobData as any
    const layers = data.layers || []
    return layers.find((l: any) => l.stage === stage) || null
  }

  // Calculate diff summary
  const job1Pred = getTopPrediction(job)
  const job2Pred = getTopPrediction(secondJob)
  const confidenceDelta =
    job1Pred && job2Pred
      ? Math.abs(job1Pred.prob - job2Pred.prob) * 100
      : null

  // Get job data and available stages
  const jobData = job as any
  const secondJobData = secondJob as any
  const availableStages = getAvailableStages(job)

  // Auto-advance state
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false)
  const autoAdvanceIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const AUTO_ADVANCE_INTERVAL = 2500 // 2.5 seconds

  // Navigate to next/previous stage
  const navigateStage = useCallback(
    (direction: 'next' | 'prev') => {
      if (availableStages.length === 0) return

      const currentIndex = selectedLayer
        ? availableStages.indexOf(selectedLayer)
        : -1

      let newIndex: number
      if (direction === 'next') {
        newIndex = currentIndex < availableStages.length - 1 ? currentIndex + 1 : 0
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : availableStages.length - 1
      }

      setSelectedLayer(availableStages[newIndex])
      // Pause auto-advance on manual navigation
      if (isAutoAdvancing) {
        setIsAutoAdvancing(false)
      }
    },
    [availableStages, selectedLayer, isAutoAdvancing]
  )

  // Keyboard shortcuts
  useEffect(() => {
    if (job?.status !== 'succeeded' || availableStages.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        navigateStage('prev')
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        navigateStage('next')
      } else if (e.key === ' ') {
        // Spacebar to toggle auto-advance
        e.preventDefault()
        setIsAutoAdvancing((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [job, availableStages, navigateStage])

  // Auto-advance effect
  useEffect(() => {
    if (!isAutoAdvancing || availableStages.length === 0) {
      if (autoAdvanceIntervalRef.current) {
        clearInterval(autoAdvanceIntervalRef.current)
        autoAdvanceIntervalRef.current = null
      }
      return
    }

    autoAdvanceIntervalRef.current = setInterval(() => {
      navigateStage('next')
    }, AUTO_ADVANCE_INTERVAL)

    return () => {
      if (autoAdvanceIntervalRef.current) {
        clearInterval(autoAdvanceIntervalRef.current)
        autoAdvanceIntervalRef.current = null
      }
    }
  }, [isAutoAdvancing, availableStages, navigateStage])

  // Toggle auto-advance
  const toggleAutoAdvance = useCallback(() => {
    setIsAutoAdvancing((prev) => !prev)
  }, [])

  return (
    <div className="flex flex-col h-screen">
      {/* Top: NetworkGraph (only show if not in compare mode) */}
      {!compareMode && (
        <div className="border-b bg-white">
          <NetworkGraph
            job={job.status === 'succeeded' ? job : null}
            selectedStage={selectedLayer}
            onStageSelect={setSelectedLayer}
          />
        </div>
      )}

      {/* Status Banner */}
      <JobStatusBanner job={job} />

      {/* Controls Bar: Auto-advance and Compare Mode */}
      {job.status === 'succeeded' && availableStages.length > 0 && (
        <div className="border-b bg-white px-4 py-2 flex items-center justify-between">
          {/* Auto-advance control */}
          {!compareMode && (
            <button
              onClick={toggleAutoAdvance}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${
                  isAutoAdvancing
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              title={isAutoAdvancing ? 'Pause auto-advance (Space)' : 'Start auto-advance (Space)'}
            >
              {isAutoAdvancing ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Play</span>
                </>
              )}
            </button>
          )}
          {!compareMode && isAutoAdvancing && (
            <span className="text-xs text-gray-500">
              Auto-advancing... Use ← → to navigate, Space to pause
            </span>
          )}
          <div className="flex-1" />
          {/* Compare mode toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => {
                setCompareMode(e.target.checked)
                setIsAutoAdvancing(false) // Stop auto-advance when enabling compare mode
                if (!e.target.checked) {
                  setSecondModelId(null)
                  setSecondJob(null)
                  setSecondJobError(null)
                }
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Compare models</span>
          </label>
        </div>
      )}

      {/* Compare Mode Toggle and Controls (fallback when no stages) */}
      {job.status === 'succeeded' && availableStages.length === 0 && (
        <div className="border-b bg-white p-4">
          <div className="flex items-center justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => {
                  setCompareMode(e.target.checked)
                  if (!e.target.checked) {
                    setSecondModelId(null)
                    setSecondJob(null)
                    setSecondJobError(null)
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Compare models</span>
            </label>

            {compareMode && (
              <div className="flex items-center gap-4 flex-1 max-w-md ml-4">
                <select
                  value={secondModelId || ''}
                  onChange={(e) => setSecondModelId(e.target.value || null)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={!models.length}
                >
                  <option value="">Select second model...</option>
                  {models
                    .filter((m) => m.id !== job.model_id)
                    .map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.display_name}
                      </option>
                    ))}
                </select>
                {secondJob && <JobStatusBanner job={secondJob} />}
                {secondJobError && (
                  <div className="text-sm text-red-600">{secondJobError}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diff Summary */}
      {compareMode &&
        job.status === 'succeeded' &&
        secondJob?.status === 'succeeded' &&
        job1Pred &&
        job2Pred && (
          <div className="border-b bg-blue-50 p-4">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div>
                <span className="font-semibold">Model 1:</span>{' '}
                {job1Pred.class_name} ({(job1Pred.prob * 100).toFixed(1)}%)
              </div>
              <div>
                <span className="font-semibold">Model 2:</span>{' '}
                {job2Pred.class_name} ({(job2Pred.prob * 100).toFixed(1)}%)
              </div>
              {confidenceDelta !== null && (
                <div>
                  <span className="font-semibold">Confidence Delta:</span>{' '}
                  {confidenceDelta.toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        )}

      {/* Main Layout */}
      {job.status === 'succeeded' ? (
        compareMode && secondJob?.status === 'succeeded' ? (
          // Compare Mode: Two Columns
          <div className="flex flex-1 overflow-hidden">
            {/* Left: LayerPicker */}
            <aside className="w-1/4 border-r bg-white overflow-y-auto">
              <LayerPicker
                stages={availableStages}
                selectedStage={selectedLayer}
                onStageSelect={setSelectedLayer}
              />
            </aside>

            {/* Two Columns */}
            <div className="flex flex-1">
              {/* Column 1: First Job */}
              <div className="flex-1 border-r bg-gray-50 flex flex-col overflow-hidden">
                <div className="border-b bg-white p-2">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {jobData.model?.display_name || job.model_id}
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="border-b bg-white">
                    <NetworkGraph
                      job={job}
                      selectedStage={selectedLayer}
                      onStageSelect={setSelectedLayer}
                      compact={true}
                    />
                  </div>
                  <div className="p-4 space-y-4">
                    <FeatureMapGrid job={job} selectedStage={selectedLayer} />
                    <HeatmapOverlay job={job} selectedStage={selectedLayer} />
                  </div>
                </div>
              </div>

              {/* Column 2: Second Job */}
              <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
                <div className="border-b bg-white p-2">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {secondJobData.model?.display_name || secondJob.model_id}
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="border-b bg-white">
                    <NetworkGraph
                      job={secondJob}
                      selectedStage={selectedLayer}
                      onStageSelect={setSelectedLayer}
                      compact={true}
                    />
                  </div>
                  <div className="p-4 space-y-4">
                    <FeatureMapGrid job={secondJob} selectedStage={selectedLayer} />
                    <HeatmapOverlay job={secondJob} selectedStage={selectedLayer} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : compareMode ? (
          // Compare Mode: Waiting for second job
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              {secondJob ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {secondJob.message || 'Processing second job...'}
                  </p>
                </>
              ) : secondModelId ? (
                <p className="text-gray-600">Creating second job...</p>
              ) : (
                <p className="text-gray-600">Select a second model to compare</p>
              )}
            </div>
          </div>
        ) : (
          // Normal Mode
          <div className="flex flex-1 overflow-hidden">
            {/* Left: LayerPicker */}
            <aside className="w-1/4 border-r bg-white overflow-y-auto">
              <LayerPicker
                stages={availableStages}
                selectedStage={selectedLayer}
                onStageSelect={setSelectedLayer}
              />
            </aside>

            {/* Center: VisualizationCanvas */}
            <main className="flex-1 bg-gray-50 overflow-y-auto">
              <VisualizationCanvas job={job} selectedStage={selectedLayer} />
            </main>

            {/* Right: LayerInfoPanel */}
            <aside className="w-1/4 border-l bg-white overflow-y-auto">
              <LayerInfoPanel job={job} selectedStage={selectedLayer} />
            </aside>
          </div>
        )
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">{job.message || 'Processing...'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ViewerPage() {
  return (
    <ErrorBoundary>
      <ViewerPageContent />
    </ErrorBoundary>
  )
}

