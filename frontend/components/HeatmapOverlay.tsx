'use client'

import { useState } from 'react'
import { JobResponse } from '@/lib/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface HeatmapOverlayProps {
  job: JobResponse | null
  selectedStage: string | null
}

// Helper function to convert relative static URLs to absolute URLs
function getImageUrl(url: string): string {
  if (url.startsWith('/static/')) {
    return `${API_BASE_URL}${url}`
  }
  return url
}

// Format probability as percentage
function formatProbability(prob: number): string {
  return `${(prob * 100).toFixed(1)}%`
}

export default function HeatmapOverlay({ job, selectedStage }: HeatmapOverlayProps) {
  const [selectedCamIndex, setSelectedCamIndex] = useState(0)
  const [opacity, setOpacity] = useState(45) // 0-100, default 45%

  // Extract data from job result
  const jobData = job as any
  const inputImageUrl = job?.status === 'succeeded' ? jobData.input?.image_url : null
  const cams = job?.status === 'succeeded' ? (jobData.cams || []) : []

  // Get selected CAM
  const selectedCam = cams.length > 0 ? cams[selectedCamIndex] : null

  // Don't render if no job, no input image, or no CAMs
  if (!job || job.status !== 'succeeded' || !inputImageUrl || cams.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <p>No CAM overlays available</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controls */}
      <div className="mb-4 space-y-4">
        {/* CAM Dropdown */}
        <div>
          <label htmlFor="cam-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select CAM Overlay
          </label>
          <select
            id="cam-select"
            value={selectedCamIndex}
            onChange={(e) => setSelectedCamIndex(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {cams.map((cam: any, index: number) => (
              <option key={cam.class_id} value={index}>
                {cam.class_name} ({formatProbability(cam.prob)})
              </option>
            ))}
          </select>
        </div>

        {/* Opacity Slider */}
        <div>
          <label htmlFor="opacity-slider" className="block text-sm font-medium text-gray-700 mb-2">
            Overlay Opacity: {opacity}%
          </label>
          <input
            id="opacity-slider"
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Image Container */}
      <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
        {/* Input Image (Base Layer) */}
        <img
          src={getImageUrl(inputImageUrl)}
          alt="Input image"
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />

        {/* CAM Overlay */}
        {selectedCam && (
          <img
            src={getImageUrl(selectedCam.overlay_url)}
            alt={`CAM overlay for ${selectedCam.class_name}`}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{
              opacity: opacity / 100,
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        )}
      </div>

      {/* Caption */}
      {selectedCam && (
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-gray-700">
            Evidence for: <span className="font-semibold">{selectedCam.class_name}</span> (
            <span className="font-semibold">{formatProbability(selectedCam.prob)}</span>)
          </p>
        </div>
      )}
    </div>
  )
}

