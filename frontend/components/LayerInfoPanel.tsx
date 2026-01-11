'use client'

import { JobResponse } from '@/lib/api'

interface LayerInfoPanelProps {
  job: JobResponse
  selectedStage: string | null
}

export default function LayerInfoPanel({ job, selectedStage }: LayerInfoPanelProps) {
  // When status is 'succeeded', layers are at top level, not under result
  // Find layer by stage
  const jobData = job as any
  const selectedLayerData = jobData.layers?.find((l: any) => l.stage === selectedStage)

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Layer Info</h2>

      {!selectedStage ? (
        <div className="text-center py-12 px-4">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-700 font-medium mb-1">Select a stage to view details</p>
          <p className="text-xs text-gray-500">Stage information, channel statistics, and processing timings will appear here</p>
        </div>
      ) : selectedLayerData ? (
        <div className="space-y-6">
          {/* Layer Name */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Layer Name
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <code className="text-sm text-gray-900 font-mono">{selectedLayerData.name}</code>
            </div>
          </div>

          {/* Shape Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Shape
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Channels (C):</span>
                <span className="text-sm font-mono font-semibold text-gray-900">
                  {selectedLayerData.shape.c}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Height (H):</span>
                <span className="text-sm font-mono font-semibold text-gray-900">
                  {selectedLayerData.shape.h}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Width (W):</span>
                <span className="text-sm font-mono font-semibold text-gray-900">
                  {selectedLayerData.shape.w}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-300 mt-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Size:</span>
                  <span className="text-sm font-mono font-semibold text-gray-900">
                    {selectedLayerData.shape.c} × {selectedLayerData.shape.h} × {selectedLayerData.shape.w}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Channels */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Top Channels ({selectedLayerData.top_channels.length})
            </h3>
            <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {selectedLayerData.top_channels.map((channel, index) => (
                  <div key={channel.channel} className="p-3 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        #{index + 1} Channel {channel.channel}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Mean:</span>
                        <span className="font-mono">{channel.mean.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max:</span>
                        <span className="font-mono">{channel.max.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Job Info */}
          {jobData.timings && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Processing Info
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Preprocess:</span>
                  <span className="font-mono text-gray-900">{jobData.timings.preprocess_ms.toFixed(1)} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Forward:</span>
                  <span className="font-mono text-gray-900">{jobData.timings.forward_ms.toFixed(1)} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Serialize:</span>
                  <span className="font-mono text-gray-900">{jobData.timings.serialize_ms.toFixed(1)} ms</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300 font-semibold">
                  <span className="text-gray-700">Total:</span>
                  <span className="font-mono text-gray-900">{jobData.timings.total_ms.toFixed(1)} ms</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Layer data not available</p>
        </div>
      )}
    </div>
  )
}

