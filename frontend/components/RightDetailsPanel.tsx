'use client'

import { useState } from 'react'
import { JobResponse } from '@/lib/api'

interface RightDetailsPanelProps {
  job: JobResponse | null
  selectedStage: string | null
  compareMode: boolean
  onCompareModeChange: (enabled: boolean) => void
  topK: number
  camLayers: string[]
  availableLayers: string[]
  onTopKChange: (k: number) => void
  onLayersChange: (layers: string[]) => void
  onApplySettings: () => void
  models?: Array<{ id: string; display_name: string }>
  secondModelId?: string | null
  onSecondModelChange?: (modelId: string | null) => void
}

export default function RightDetailsPanel({
  job,
  selectedStage,
  compareMode,
  onCompareModeChange,
  topK,
  camLayers,
  availableLayers,
  onTopKChange,
  onLayersChange,
  onApplySettings,
  models = [],
  secondModelId,
  onSecondModelChange,
}: RightDetailsPanelProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const jobData = job as any
  const selectedLayerData = jobData?.layers?.find((l: any) => l.stage === selectedStage)

  // Get top-1 prediction
  const topPrediction = job?.status === 'succeeded' ? jobData?.prediction?.topk?.[0] : null
  const predictionLabel = topPrediction?.class_name || '—'
  const predictionProb = topPrediction?.prob ?? null
  const predictionPercent = predictionProb != null ? (predictionProb * 100).toFixed(1) : null

  return (
    <aside className="w-1/4 border-l bg-white overflow-y-auto">
      <div className="sticky top-4 p-6">
        {/* Final Prediction Card */}
        <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg shadow-md">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Final Prediction
          </h3>
          {topPrediction ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-bold text-gray-900 truncate" title={predictionLabel}>
                  {predictionLabel}
                </div>
              </div>
              {predictionPercent && (
                <div className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white text-2xl font-bold rounded-lg shadow-sm">
                  {predictionPercent}%
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-2xl font-semibold text-gray-400 mb-1">—</div>
              <div className="text-sm text-gray-500">No prediction available</div>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Details</h2>

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
            <p className="text-gray-700 font-medium mb-1">Select a layer to view details</p>
            <p className="text-xs text-gray-500">
              Layer information, channel statistics, and processing timings will appear here
            </p>
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
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="text-sm font-mono font-semibold text-gray-900">
                      {selectedLayerData.shape.c} × {selectedLayerData.shape.h} ×{' '}
                      {selectedLayerData.shape.w}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Channels */}
            {selectedLayerData.top_channels && selectedLayerData.top_channels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Top Channels
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2 max-h-64 overflow-y-auto">
                  {selectedLayerData.top_channels.slice(0, 10).map((channel: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">Channel {channel.channel}</span>
                      <span className="text-gray-900 font-mono">
                        {channel.mean.toFixed(3)} / {channel.max.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processing Info */}
            {jobData?.timings && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Processing Info
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preprocess:</span>
                    <span className="text-gray-900 font-mono">
                      {jobData.timings.preprocess_ms?.toFixed(1)} ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Forward:</span>
                    <span className="text-gray-900 font-mono">
                      {jobData.timings.forward_ms?.toFixed(1)} ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Serialize:</span>
                    <span className="text-gray-900 font-mono">
                      {jobData.timings.serialize_ms?.toFixed(1)} ms
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="text-gray-900 font-semibold">Total:</span>
                    <span className="text-gray-900 font-mono font-semibold">
                      {jobData.timings.total_ms?.toFixed(1)} ms
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500">Layer data not available</p>
          </div>
        )}

        {/* Advanced Controls Accordion */}
        {job?.status === 'succeeded' && (
          <div className="mt-6 border-t pt-6">
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900">Advanced Controls</h3>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  isAdvancedOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isAdvancedOpen && (
              <div className="mt-4 space-y-4">
                {/* Compare Models Toggle */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compareMode}
                      onChange={(e) => onCompareModeChange(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Compare models</span>
                  </label>
                  {compareMode && models.length > 0 && onSecondModelChange && (
                    <div className="mt-2">
                      <select
                        value={secondModelId || ''}
                        onChange={(e) => onSecondModelChange(e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    </div>
                  )}
                </div>

                {/* Top-K Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Top-K Classes: {topK}
                  </label>
                  <select
                    value={topK}
                    onChange={(e) => onTopKChange(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CAM Layers Checkboxes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Layers for Grad-CAM:
                  </label>
                  <div className="space-y-2">
                    {availableLayers.map((layerName) => (
                      <label key={layerName} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={camLayers.includes(layerName)}
                          onChange={() => {
                            if (camLayers.includes(layerName)) {
                              onLayersChange(camLayers.filter((l) => l !== layerName))
                            } else {
                              onLayersChange([...camLayers, layerName])
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{layerName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={onApplySettings}
                  disabled={camLayers.length === 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Apply Settings & Re-run Job
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

