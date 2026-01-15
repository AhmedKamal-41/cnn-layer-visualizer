'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getJobStatus, JobResponse, getImageUrl } from '@/lib/api'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import JobStatusBanner from '@/components/JobStatusBanner'
import LayerPicker from '@/components/LayerPicker'
import VisualizationCanvas from '@/components/VisualizationCanvas'
import FeatureMapGrid from '@/components/FeatureMapGrid'
import GradCAMTimeline from '@/components/GradCAMTimeline'
import HeatmapOverlay from '@/components/HeatmapOverlay'
import RightDetailsPanel from '@/components/RightDetailsPanel'
import NetworkDiagram from '@/components/NetworkDiagram'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function ViewerPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params?.jobId as string

  const [job, setJob] = useState<JobResponse | null>(null)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topK, setTopK] = useState(1)
  const [camLayers, setCamLayers] = useState<string[]>([])
  const [availableLayers, setAvailableLayers] = useState<string[]>([])

  // Polling interval in milliseconds
  const POLL_INTERVAL = 2000 // 2 seconds

  // Fetch job status
  const fetchJobStatus = async () => {
    if (!jobId) return

    try {
      const jobData = await getJobStatus(jobId)
      setJob(jobData)
      setError(null)

      // Extract available layers from job data
      if (jobData.status === 'succeeded' && jobData.result?.layers) {
        const layers = jobData.result.layers.map((l: any) => l.stage).filter(Boolean)
        setAvailableLayers(layers)

        // Set default selected stage to first layer if none selected
        if (!selectedStage && layers.length > 0) {
          setSelectedStage(layers[0])
        }

        // Set default CAM layers if not set
        if (camLayers.length === 0 && layers.length > 0) {
          // Get default layers from gradcam data or use first 5 layers
          const gradcamData = jobData.result?.gradcam
          if (gradcamData?.layers) {
            setCamLayers(gradcamData.layers)
          } else {
            setCamLayers(layers.slice(0, 5))
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch job status:', err)
      setError(err instanceof Error ? err.message : 'Failed to load job')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (!jobId) {
      setError('Job ID is required')
      setIsLoading(false)
      return
    }

    fetchJobStatus()
  }, [jobId])

  // Poll for updates if job is still processing
  useEffect(() => {
    if (!job || job.status === 'succeeded' || job.status === 'failed') {
      return
    }

    const interval = setInterval(() => {
      fetchJobStatus()
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [job, jobId])

  // Handle apply settings (for re-running with different settings)
  const handleApplySettings = () => {
    if (!job || !job.model_id) return

    // Get the input image from the current job
    const inputImageUrl = job.result?.input?.image_url || `/static/${jobId}/input.png`
    
    // For now, just show a message that this feature needs the original image
    // In a full implementation, you'd need to store the original image file
    alert('To change settings, please upload a new image from the home page.')
  }

  // Dummy handlers for Navbar (not used on viewer page)
  const navHandlers = {
    onScrollToFeatures: () => {},
    onScrollToModels: () => {},
    onScrollToGetStarted: () => {},
    onScrollToHowItWorks: () => {},
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar {...navHandlers} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading job status...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Error state
  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar {...navHandlers} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Job</h1>
            <p className="text-gray-600 mb-6">{error || 'Job not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Extract layers for LayerPicker
  const layers = job.status === 'succeeded' && job.result?.layers
    ? job.result.layers.map((l: any) => ({
        stage: l.stage || l.name,
        name: l.name,
        shape: l.shape,
      }))
    : []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar {...navHandlers} />
      
      <ErrorBoundary>
        {/* Status Banner */}
        <JobStatusBanner job={job} />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Layer Picker */}
          <aside className="w-64 border-r bg-white overflow-y-auto">
            <LayerPicker
              layers={layers}
              selectedStage={selectedStage}
              onStageSelect={setSelectedStage}
            />
          </aside>

          {/* Center - Visualization Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {job.status === 'succeeded' ? (
              <>
                {/* Network Diagram */}
                {layers.length > 0 && (
                  <div className="border-b bg-white p-4">
                    <NetworkDiagram
                      layers={layers}
                      selectedStage={selectedStage}
                      onLayerSelect={setSelectedStage}
                      inputImageUrl={job.result?.input?.image_url ? getImageUrl(job.result.input.image_url) : undefined}
                      predictionLabel={job.result?.prediction?.topk?.[0]?.class_name}
                      predictionProb={job.result?.prediction?.topk?.[0]?.prob}
                    />
                  </div>
                )}

                {/* Visualization Canvas */}
                <div className="flex-1 overflow-y-auto">
                  <VisualizationCanvas job={job} selectedStage={selectedStage} />
                </div>

                {/* Feature Maps Grid */}
                {selectedStage && (
                  <div className="border-t bg-white p-6">
                    <FeatureMapGrid job={job} selectedStage={selectedStage} />
                  </div>
                )}

                {/* Grad-CAM Timeline */}
                <div className="border-t bg-white p-6">
                  <GradCAMTimeline job={job} selectedStage={selectedStage} />
                </div>

                {/* Heatmap Overlay */}
                <div className="border-t bg-white p-6">
                  <HeatmapOverlay job={job} selectedStage={selectedStage} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center max-w-md">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Processing Your Image
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {job.message || 'Running inference and generating visualizations...'}
                  </p>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden max-w-xs mx-auto">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{job.progress}% complete</p>
                </div>
              </div>
            )}
          </main>

          {/* Right Sidebar - Details Panel */}
          {job.status === 'succeeded' && (
            <RightDetailsPanel
              job={job}
              selectedStage={selectedStage}
              topK={topK}
              camLayers={camLayers}
              availableLayers={availableLayers}
              onTopKChange={setTopK}
              onLayersChange={setCamLayers}
              onApplySettings={handleApplySettings}
            />
          )}
        </div>
      </ErrorBoundary>

      <Footer />
    </div>
  )
}

