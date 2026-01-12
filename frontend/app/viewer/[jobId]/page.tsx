'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import JobStatusBanner from '@/components/JobStatusBanner'
import NetworkGraph from '@/components/NetworkGraph'
import NetworkDiagram from '@/components/NetworkDiagram'
import LayerPicker from '@/components/LayerPicker'
import VisualizationCanvas from '@/components/VisualizationCanvas'
import LayerInfoPanel from '@/components/LayerInfoPanel'
import FeatureMapGrid from '@/components/FeatureMapGrid'
import HeatmapOverlay from '@/components/HeatmapOverlay'
import GradCAMTimeline from '@/components/GradCAMTimeline'
import GradCAMControls from '@/components/GradCAMControls'
import LayerExplainer from '@/components/LayerExplainer'
import RightDetailsPanel from '@/components/RightDetailsPanel'
import ErrorBoundary from '@/components/ErrorBoundary'
import { getJobStatus, JobResponse, createJob } from '@/lib/api'
import { useRouter } from 'next/navigation'

// Layer type interface
interface Layer {
  name: string
  stage: string | null
  shape?: { c: number; h: number; w: number }
}

function ViewerPageContent() {
  const params = useParams()
  const jobId = params.jobId as string
  const [job, setJob] = useState<JobResponse | null>(null)
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Convert image URL to File for job creation
  const urlToFile = async (url: string): Promise<File> => {
    const response = await fetch(url)
    const blob = await response.blob()
    const filename = url.split('/').pop() || 'image.png'
    return new File([blob], filename, { type: blob.type || 'image/png' })
  }

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
    }
  }, [jobId])

  // Helper function to extract available stages from layers
  const getAvailableStages = (jobData: JobResponse | null): string[] => {
    if (!jobData || jobData.status !== 'succeeded') return []
    const data = jobData as any
    const layers = data.layers || []
    const stages = layers
      .map((l: Layer) => l.stage)
      .filter((s: string | null) => s !== null && s !== undefined)
      .filter((s: string, index: number, arr: string[]) => arr.indexOf(s) === index) // unique
      .sort()
    return stages
  }

  // Compute available stages using useMemo
  const availableStages = useMemo(() => getAvailableStages(job), [job])

  // Get layers data for LayerPicker and ArchitectureBar
  const layers = useMemo(() => {
    if (!job || job.status !== 'succeeded') return []
    const jobData = job as any
    return (jobData.layers || []).filter((l: Layer) => l.stage !== null && l.stage !== undefined)
  }, [job])

  // Get selected layer data
  const selectedLayerData = useMemo(() => {
    if (!selectedLayer || !job || job.status !== 'succeeded') return null
    const jobData = job as any
    return (jobData.layers || []).find((l: Layer) => l.stage === selectedLayer) || null
  }, [selectedLayer, job])


  // Auto-advance state
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false)
  const autoAdvanceIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const AUTO_ADVANCE_INTERVAL = 2500 // 2.5 seconds
  
  // Grad-CAM settings state
  const router = useRouter()
  const [topK, setTopK] = useState(3)
  const [camLayers, setCamLayers] = useState<string[]>(['conv1', 'layer1', 'layer2', 'layer3', 'layer4'])

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

  // Get job data (computed after all hooks, safe to use in render)
  const jobData = job as any

  return (
    <div className="flex flex-col h-screen">
      {/* Top: NetworkDiagram */}
      {job?.status === 'succeeded' && layers.length > 0 && (
        <div className="border-b bg-white px-6 py-4">
          <NetworkDiagram
            layers={layers}
            selectedStage={selectedLayer}
            onLayerSelect={setSelectedLayer}
            inputImageUrl={jobData?.input?.image_url}
            predictionLabel={getTopPrediction(job)?.class_name}
            predictionProb={getTopPrediction(job)?.prob}
          />
          <p className="text-xs text-gray-500 text-center mt-3">
            Click a layer to see what the CNN learns at that stage.
          </p>
        </div>
      )}

      {/* Status Banner */}
      <JobStatusBanner job={job} />

      {/* Controls Bar: Auto-advance */}
      {job.status === 'succeeded' && availableStages.length > 0 && (
        <div className="border-b bg-white px-4 py-2 flex items-center justify-between">
          {/* Auto-advance control */}
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
          {isAutoAdvancing && (
            <span className="text-xs text-gray-500">
              Auto-advancing... Use ← → to navigate, Space to pause
            </span>
          )}
          <div className="flex-1" />
        </div>
      )}

      {/* Main Layout */}
      {job.status === 'succeeded' ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: LayerPicker */}
          <aside className="w-1/4 border-r bg-white overflow-y-auto">
            <LayerPicker
              layers={layers}
              selectedStage={selectedLayer}
              onStageSelect={setSelectedLayer}
            />
          </aside>

          {/* Center: Layer Learning View */}
          <main className="flex-1 bg-gray-50 overflow-y-auto">
            <div className="p-6">
              {/* Header: LayerExplainer */}
              <LayerExplainer
                layerName={selectedLayerData?.name || null}
                layerStage={selectedLayer || null}
              />

              {/* Section A: Feature Maps */}
              {selectedLayer && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Feature Maps</h2>
                  <FeatureMapGrid job={job} selectedStage={selectedLayer} />
                </div>
              )}

              {/* Section B: Grad-CAM Timeline (only if data exists) */}
              {job.status === 'succeeded' && (
                <GradCAMTimeline job={job} selectedStage={selectedLayer} />
              )}
            </div>
          </main>

          {/* Right: RightDetailsPanel (sticky) */}
          <RightDetailsPanel
            job={job}
            selectedStage={selectedLayer}
            topK={topK}
            camLayers={camLayers}
            availableLayers={jobData.gradcam?.layers || ['conv1', 'layer1', 'layer2', 'layer3', 'layer4']}
            onTopKChange={setTopK}
            onLayersChange={setCamLayers}
            onApplySettings={async () => {
              try {
                const inputImageUrl = jobData.input?.image_url
                if (!inputImageUrl) return
                
                const imageFile = await urlToFile(inputImageUrl)
                const newJob = await createJob(imageFile, job.model_id, topK, camLayers)
                router.push(`/viewer/${newJob.job_id}`)
              } catch (err) {
                console.error('Failed to re-run job:', err)
                setError(err instanceof Error ? err.message : 'Failed to re-run job')
              }
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your image… feature maps will appear automatically.</p>
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

