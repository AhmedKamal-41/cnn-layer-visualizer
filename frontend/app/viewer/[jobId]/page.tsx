'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import NetworkDiagram from '@/components/NetworkDiagram'
import LayerPicker from '@/components/LayerPicker'
import FeatureMapGrid from '@/components/FeatureMapGrid'
import GradCAMTimeline from '@/components/GradCAMTimeline'
import RightDetailsPanel from '@/components/RightDetailsPanel'
import ErrorBoundary from '@/components/ErrorBoundary'
import LoadingOverlay from '@/components/LoadingOverlay'
import { getJobStatus, JobResponse, createJob } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useProgress } from '@/hooks/useProgress'
import { useRotatingMessage } from '@/hooks/useRotatingMessage'

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
  const [isLoading, setIsLoading] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [topK, setTopK] = useState(1)
  const [camLayers, setCamLayers] = useState<string[]>(['conv1', 'layer1', 'layer2', 'layer3', 'layer4'])
  
  const { progress: loadingProgress, setProgress: setLoadingProgress, resetProgress: resetLoadingProgress } = useProgress({
    enabled: isLoading && !loadingError,
  })
  
  const currentMessage = useRotatingMessage({
    enabled: isLoading && !loadingError,
  })

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
        if (jobData.status === 'succeeded' || jobData.status === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        }
      } catch (err) {
        console.error('Failed to fetch job status:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch job status')
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    }
    fetchJobStatus()
    pollingIntervalRef.current = setInterval(fetchJobStatus, 700)
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [jobId])

  const layers = useMemo(() => {
    if (!job || job.status !== 'succeeded') return []
    const jobData = job as any
    return (jobData.layers || []).map((layer: Layer) => ({
      name: layer.name,
      stage: layer.stage,
    }))
  }, [job])

  const router = useRouter()

  const handleRetry = useCallback(async () => {
    if (!job) return
    setLoadingError(null)
    resetLoadingProgress()
    try {
      setIsLoading(true)
      const jobData = job as any
      const inputImageUrl = jobData.input?.image_url || jobData.result?.input?.image_url
      if (!inputImageUrl) throw new Error('Input image URL not found')
      const imageFile = await urlToFile(inputImageUrl)
      const newJob = await createJob(imageFile, job.model_id, topK, camLayers)
      setLoadingProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        router.push(`/viewer/${newJob.job_id}`)
      }, 300)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to re-run job'
      setError(errorMessage)
      setLoadingError(errorMessage)
      setIsLoading(false)
    }
  }, [job, topK, camLayers, router, setLoadingProgress, resetLoadingProgress])

  const handleCancelLoading = useCallback(() => {
    setIsLoading(false)
    setLoadingError(null)
    resetLoadingProgress()
  }, [resetLoadingProgress])

  const handleApplySettings = useCallback(async () => {
    if (!job) return
    try {
      const jobData = job as any
      const inputImageUrl = jobData.input?.image_url || jobData.result?.input?.image_url
      if (!inputImageUrl) throw new Error('Input image URL not found')
      setIsLoading(true)
      setLoadingError(null)
      resetLoadingProgress()
      const imageFile = await urlToFile(inputImageUrl)
      const newJob = await createJob(imageFile, job.model_id, topK, camLayers)
      setLoadingProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        router.push(`/viewer/${newJob.job_id}`)
      }, 300)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to re-run job'
      setError(errorMessage)
      setLoadingError(errorMessage)
      setIsLoading(false)
    }
  }, [job, topK, camLayers, router, setLoadingProgress, resetLoadingProgress])

  const jobData = job as any

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <LoadingOverlay
        isOpen={isLoading}
        progress={loadingProgress}
        title="Processing your image"
        message={currentMessage}
        error={loadingError}
        onRetry={handleRetry}
        onCancel={handleCancelLoading}
      />
      {job && job.status === 'succeeded' ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6">
          <main className="flex-1 space-y-6">
            <NetworkDiagram job={job} selectedStage={selectedLayer} />
            <LayerPicker
              layers={layers}
              selectedLayer={selectedLayer}
              onLayerSelect={setSelectedLayer}
            />
            {selectedLayer && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Feature Maps</h2>
                <FeatureMapGrid job={job} selectedStage={selectedLayer} />
              </div>
            )}
            {job.status === 'succeeded' && (
              <GradCAMTimeline job={job} selectedStage={selectedLayer} />
            )}
          </main>
          <RightDetailsPanel
            job={job}
            selectedStage={selectedLayer}
            topK={topK}
            camLayers={camLayers}
            availableLayers={jobData.gradcam?.layers || ['conv1', 'layer1', 'layer2', 'layer3', 'layer4']}
            onTopKChange={setTopK}
            onLayersChange={setCamLayers}
            onApplySettings={handleApplySettings}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your imageâ€¦ feature maps will appear automatically.</p>
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
