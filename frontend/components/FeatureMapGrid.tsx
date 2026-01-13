'use client'

import { useState, useEffect, useMemo } from 'react'
import { JobResponse, getImageUrl } from '@/lib/api'

interface FeatureMapGridProps {
  job: JobResponse | null
  selectedStage: string | null
}

// Skeleton placeholder component
function SkeletonPlaceholder() {
  return (
    <div className="w-full h-full bg-gray-200 animate-pulse rounded">
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-400 text-xs">Loading...</div>
      </div>
    </div>
  )
}

export default function FeatureMapGrid({ job, selectedStage }: FeatureMapGridProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedChannelIndex, setSelectedChannelIndex] = useState<number | null>(null)
  const [imageLoading, setImageLoading] = useState<Set<number>>(new Set())

  // Extract selected layer data by stage
  const jobData = job as any
  const selectedLayerData = job?.status === 'succeeded' && selectedStage
    ? (jobData.layers || []).find((l: any) => l.stage === selectedStage)
    : null

  const channels = selectedLayerData?.top_channels || []

  // Handle keyboard navigation in modal
  useEffect(() => {
    if (!isModalOpen || selectedChannelIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
        setSelectedChannelIndex(null)
      } else if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, selectedChannelIndex, channels.length])

  const handleTileClick = (index: number) => {
    setSelectedChannelIndex(index)
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedChannelIndex(null)
  }

  const handlePrevious = () => {
    if (selectedChannelIndex !== null && selectedChannelIndex > 0) {
      setSelectedChannelIndex(selectedChannelIndex - 1)
    }
  }

  const handleNext = () => {
    if (selectedChannelIndex !== null && selectedChannelIndex < channels.length - 1) {
      setSelectedChannelIndex(selectedChannelIndex + 1)
    }
  }

  const handleImageLoad = (index: number) => {
    setImageLoading((prev) => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }

  const handleImageStartLoad = (index: number) => {
    setImageLoading((prev) => new Set(prev).add(index))
  }

  const currentChannel = selectedChannelIndex !== null ? channels[selectedChannelIndex] : null

  if (!selectedStage) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-medium text-gray-700 mb-1">Select a stage to view feature maps</p>
          <p className="text-xs text-gray-500">Choose a stage from the left panel to see channel visualizations</p>
        </div>
      </div>
    )
  }

  if (!selectedLayerData || channels.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-sm font-medium text-gray-700 mb-1">No feature maps available</p>
          <p className="text-xs text-gray-500">This layer doesn't have any feature maps to display</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 p-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Feature Maps: <span className="font-mono text-lg">{selectedLayerData?.name || selectedStage || 'No layer selected'}</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {channels.map((channel: any, index: number) => {
            const isLoading = imageLoading.has(index)
            const imageUrl = getImageUrl(channel.image_url)

            return (
              <div
                key={channel.channel}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleTileClick(index)}
              >
                <div className="aspect-square bg-gray-100 relative">
                  {isLoading && <SkeletonPlaceholder />}
                  <img
                    src={imageUrl}
                    alt={`Channel ${channel.channel}`}
                    className={`w-full h-full object-contain ${isLoading ? 'hidden' : ''}`}
                    loading="lazy"
                    onLoadStart={() => handleImageStartLoad(index)}
                    onLoad={() => handleImageLoad(index)}
                    onError={(e) => {
                      handleImageLoad(index)
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      if (target.parentElement) {
                        const placeholder = document.createElement('div')
                        placeholder.className = 'w-full h-full flex items-center justify-center text-gray-400 text-xs'
                        placeholder.textContent = `Ch ${channel.channel}`
                        target.parentElement.appendChild(placeholder)
                      }
                    }}
                  />
                </div>
                <div className="p-2 bg-gray-50 border-t border-gray-200">
                  <div className="text-xs font-mono text-gray-700 font-semibold">
                    Channel {channel.channel}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <div>Mean: {channel.mean.toFixed(3)}</div>
                    <div>Max: {channel.max.toFixed(3)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Caption */}
        <p className="text-sm text-gray-600 text-center mt-4 italic">
          Each image is one learned filter output.
        </p>
      </div>

      {/* Modal */}
      {isModalOpen && currentChannel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-5xl max-h-[90vh] w-full m-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Channel {currentChannel.channel}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center p-4 bg-gray-50 relative">
              <img
                src={getImageUrl(currentChannel.image_url)}
                alt={`Channel ${currentChannel.channel} feature map`}
                className="max-w-full max-h-[70vh] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />

              {/* Navigation Buttons */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrevious()
                }}
                disabled={selectedChannelIndex === 0}
                className={`
                  absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow-lg
                  transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-label="Previous channel"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
                disabled={selectedChannelIndex === channels.length - 1}
                className={`
                  absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow-lg
                  transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-label="Next channel"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Footer with Stats */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">Mean:</span> {currentChannel.mean.toFixed(4)} |{' '}
                  <span className="font-semibold">Max:</span> {currentChannel.max.toFixed(4)}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedChannelIndex !== null && (
                    <>
                      {selectedChannelIndex + 1} / {channels.length}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

