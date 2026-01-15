'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getJobStatus, JobResponse, createJob } from '@/lib/api'
import JobStatusBanner from '@/components/JobStatusBanner'
import NetworkGraph from '@/components/NetworkGraph'
import LayerPicker from '@/components/LayerPicker'
import LayerExplainer from '@/components/LayerExplainer'
import FeatureMapGrid from '@/components/FeatureMapGrid'
import GradCAMTimeline from '@/components/GradCAMTimeline'
import RightDetailsPanel from '@/components/RightDetailsPanel'
import Navbar from '@/components/Navbar'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function ViewerPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params?.jobId as string

  const [job, setJob] = useState<JobResponse | null>(null)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [topK, setTopK] = useState(1)
  const [camLayers, setCamLayers] = useState<string[]>([])
  const [availableLayers, setAvailableLayers] = useState<string[]>([])

  // Fetch job status
  useEffect(() => {
    if (!jobId) return

    const fetchJob = async () => {
      try {
        const jobData = await getJobStatus(jobId)
        setJob(jobData)

        // Set initial selected stage if job is succeeded
        if (jobData.status === 'succeeded' && !selectedStage) {
          const jobDataAny = jobData as any
          const layers = jobDataAny.layers || []
          if (layers.length > 0) {
            setSelectedStage(layers[0].stage || null)
          }
          // Set available layers for CAM
          if (layers.length > 0) {
            setAvailableLayers(layers.map((l: any) => l.name).filter(Boolean))
            // Set default CAM layers (first 5 or all if less than 5)
            const defaultCamLayers = layers.slice(0, 5).map((l: any) => l.name).filter(Boolean)
            if (defaultCamLayers.length > 0) {
              setCamLayers(defaultCamLayers)
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch job:', err)
        setError(err instanceof Error ? err.message : 'Failed to load job')
      }
    }

    fetchJob()

    // Poll job status if job is queued or running
    const interval = setInterval(() => {
      if (job?.status === 'queued' || job?.status === 'running') {
        fetchJob()
      } else {
        clearInterval(interval)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [jobId, job?.status, selectedStage])

  const handleApplySettings = async () => {
    if (!job || job.status !== 'succeeded') return

    const jobData = job as any
    const imageUrl = jobData.input?.image_url

    if (!imageUrl || !job.model_id) {
      setError('Cannot create new job: missing image or model information')
      return
    }

    try {
      // Fetch the original image
      const response = await fetch(imageUrl.startsWith('http') ? imageUrl : `/${imageUrl}`)
      const blob = await response.blob()
      const imageFile = new File([blob], 'image.jpg', { type: 'image/jpeg' })

      // Create new job with updated settings
      const newJob = await createJob(imageFile, job.model_id, topK, camLayers)
      router.push(`/viewer/${newJob.job_id}`)
    } catch (err) {
      console.error('Failed to create new job:', err)
      setError(err instanceof Error ? err.message : 'Failed to create new job')
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          onScrollToFeatures={() => {}}
          onScrollToModels={() => {}}
          onScrollToGetStarted={() => {}}
          onScrollToHowItWorks={() => {}}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-900 mb-2">Error</h1>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          onScrollToFeatures={() => {}}
          onScrollToModels={() => {}}
          onScrollToGetStarted={() => {}}
          onScrollToHowItWorks={() => {}}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading job...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const jobData = job as any
  const layers = job.status === 'succeeded' ? (jobData.layers || []) : []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        onScrollToFeatures={() => {}}
        onScrollToModels={() => {}}
        onScrollToGetStarted={() => {}}
        onScrollToHowItWorks={() => {}}
      />
      <ErrorBoundary>
        <>
          {/* Job Status Banner */}
          <JobStatusBanner job={job} />

          {/* Top Section - Network Graph */}
          {job.status === 'succeeded' && (
            <div className="bg-white border-b">
              <NetworkGraph
                job={job}
                selectedStage={selectedStage}
                onStageSelect={setSelectedStage}
              />
              <div className="px-6 pb-4">
                <p className="text-sm text-gray-600 text-center">
                  Click a layer to see what the CNN learns at that stage.
                </p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Layers */}
            <div className="w-64 border-r bg-white overflow-y-auto flex flex-col">
              {job.status === 'succeeded' && layers.length > 0 && (
                <>
                  {/* Play Button */}
                  <div className="p-4 border-b">
                    <button
                      onClick={() => {
                        // Auto-play through layers
                        let currentIndex = 0
                        const playInterval = setInterval(() => {
                          if (currentIndex < layers.length) {
                            setSelectedStage(layers[currentIndex].stage || null)
                            currentIndex++
                          } else {
                            clearInterval(playInterval)
                          }
                        }, 2000)
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      Play
                    </button>
                  </div>

                  {/* Layers Section */}
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Layers</h2>
                    <p className="text-sm text-gray-600 mb-4">Start from conv1 and move right.</p>
                  </div>

                  {/* Layer Picker */}
                  <div className="flex-1">
                    <LayerPicker
                      layers={layers}
                      selectedStage={selectedStage}
                      onStageSelect={setSelectedStage}
                    />
                  </div>
                </>
              )}

              {/* Loading State */}
              {job.status !== 'succeeded' && (
                <div className="p-4">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading layers...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Main Visualization Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {job.status === 'succeeded' ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* If layer is selected, show layer details first */}
                  {selectedStage ? (
                    <>
                      {/* Layer Title and Description */}
                      {(() => {
                        const selectedLayer = layers.find((l: any) => l.stage === selectedStage)
                        return (
                          <LayerExplainer
                            layerName={selectedLayer?.name || null}
                            layerStage={selectedStage}
                          />
                        )
                      })()}

                      {/* Feature Maps Grid */}
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Feature Maps</h2>
                        {(() => {
                          const selectedLayer = layers.find((l: any) => l.stage === selectedStage)
                          const layerName = selectedLayer?.name || selectedStage
                          return (
                            <div className="mb-4">
                              <h3 className="text-lg font-medium text-gray-700 mb-4">
                                Feature Maps: {layerName}
                              </h3>
                              <FeatureMapGrid job={job} selectedStage={selectedStage} />
                            </div>
                          )
                        })()}
                      </div>

                      {/* Grad-CAM below layer details */}
                      <div className="mt-8">
                        <GradCAMTimeline job={job} selectedStage={selectedStage} />
                      </div>
                    </>
                  ) : (
                    /* If no layer selected, show Grad-CAM prominently in center */
                    <div className="flex flex-col items-center justify-center min-h-[400px]">
                      <div className="w-full max-w-4xl">
                        <GradCAMTimeline job={job} selectedStage={selectedStage} />
                      </div>
                      <div className="mt-8 text-center">
                        <p className="text-gray-500 text-lg mb-2">Select a layer to view feature maps</p>
                        <p className="text-gray-400 text-sm">Click on a layer from the network diagram or left sidebar</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{job.message || 'Processing...'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Details & Controls */}
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
        </>
      </ErrorBoundary>
    </div>
  )
}
