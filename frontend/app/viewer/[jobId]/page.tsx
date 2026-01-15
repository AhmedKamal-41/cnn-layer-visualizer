'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getJobStatus, JobResponse, getImageUrl } from '@/lib/api'
import NetworkDiagram from '@/components/NetworkDiagram'
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
  const [isPlaying, setIsPlaying] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  // Fetch job status
  useEffect(() => {
    if (!jobId) return

    const fetchJob = async () => {
      try {
        const jobData = await getJobStatus(jobId)
        setJob(jobData)

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
          {/* Top Section - Network Diagram */}
          {job.status === 'succeeded' && (
            <div className="bg-white border-b">
              {(() => {
                const jobData = job as any
                const layers = jobData.layers || []
                const topPrediction = jobData.prediction?.topk?.[0]
                const inputImageUrl = jobData.input?.image_url
                
                return (
                  <NetworkDiagram
                    layers={layers}
                    selectedStage={selectedStage}
                    onLayerSelect={setSelectedStage}
                    inputImageUrl={inputImageUrl ? getImageUrl(inputImageUrl) : undefined}
                    predictionLabel={topPrediction?.class_name}
                    predictionProb={topPrediction?.prob}
                  />
                )
              })()}
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
                        if (isPlaying) {
                          // Stop playing
                          if (playIntervalRef.current) {
                            clearInterval(playIntervalRef.current)
                            playIntervalRef.current = null
                          }
                          setIsPlaying(false)
                        } else {
                          // Start playing
                          setIsPlaying(true)
                          let currentIndex = layers.findIndex((l: any) => l.stage === selectedStage)
                          if (currentIndex === -1) currentIndex = 0
                          
                          const interval = setInterval(() => {
                            if (currentIndex < layers.length) {
                              setSelectedStage(layers[currentIndex].stage || null)
                              currentIndex++
                            } else {
                              clearInterval(interval)
                              playIntervalRef.current = null
                              setIsPlaying(false)
                            }
                          }, 2000)
                          
                          // Store interval in ref for cleanup
                          playIntervalRef.current = interval
                        }
                      }}
                      className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        isPlaying
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                          </svg>
                          Stop
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                          Play
                        </>
                      )}
                    </button>
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

            {/* Right Sidebar - Details */}
            {job.status === 'succeeded' && (
              <RightDetailsPanel
                job={job}
                selectedStage={selectedStage}
              />
            )}
          </div>
        </>
      </ErrorBoundary>
    </div>
  )
}
