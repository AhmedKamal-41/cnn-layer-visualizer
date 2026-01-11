'use client'

import { JobResponse } from '@/lib/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface VisualizationCanvasProps {
  job: JobResponse
  selectedStage: string | null
}

// Helper function to convert relative static URLs to absolute URLs
function getImageUrl(url: string): string {
  if (url.startsWith('/static/')) {
    return `${API_BASE_URL}${url}`
  }
  return url
}

export default function VisualizationCanvas({ job, selectedStage }: VisualizationCanvasProps) {
  // Find the selected layer data by stage (when status is 'succeeded', layers are at top level)
  const jobData = job as any
  const selectedLayerData = jobData.layers?.find((l: any) => l.stage === selectedStage)

  return (
    <div className="p-6 h-full">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Visualization Canvas</h2>
        {selectedStage && (
          <p className="text-sm text-gray-600 mt-1">
            Stage: <span className="font-semibold">{selectedStage}</span>
            {selectedLayerData && (
              <span className="text-gray-500 ml-2">({selectedLayerData.name})</span>
            )}
          </p>
        )}
      </div>

      {!selectedStage ? (
        <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center px-4">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
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
            <p className="text-gray-700 text-lg font-medium mb-2">Select a stage to view visualizations</p>
            <p className="text-gray-500 text-sm">Choose a stage from the left panel to explore feature maps and heatmaps</p>
          </div>
        </div>
      ) : selectedLayerData ? (
        <div className="space-y-6">
          {/* Feature Maps Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Feature Maps</h3>
            <div className="grid grid-cols-4 gap-4">
              {selectedLayerData.top_channels.slice(0, 8).map((channel) => (
                <div
                  key={channel.channel}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                    <img
                      src={getImageUrl(channel.image_url)}
                      alt={`Channel ${channel.channel}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback if image fails to load
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
                    <div className="text-xs font-mono text-gray-700">Channel {channel.channel}</div>
                    <div className="text-xs text-gray-500">
                      Mean: {channel.mean.toFixed(3)} | Max: {channel.max.toFixed(3)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Layer Info */}
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Layer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Shape:</span>
                <span className="ml-2 font-mono text-gray-900">
                  {selectedLayerData.shape.c} × {selectedLayerData.shape.h} × {selectedLayerData.shape.w}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Channels:</span>
                <span className="ml-2 font-mono text-gray-900">{selectedLayerData.shape.c}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Height:</span>
                <span className="ml-2 font-mono text-gray-900">{selectedLayerData.shape.h}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Width:</span>
                <span className="ml-2 font-mono text-gray-900">{selectedLayerData.shape.w}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
          <p className="text-gray-500">Layer data not available</p>
        </div>
      )}
    </div>
  )
}

