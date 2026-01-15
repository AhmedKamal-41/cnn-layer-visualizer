'use client'

import { useState } from 'react'
import { JobResponse } from '@/lib/api'

interface NetworkGraphProps {
  job: JobResponse | null
  selectedStage: string | null
  onStageSelect: (stage: string | null) => void
  compact?: boolean
}

export default function NetworkGraph({ job, selectedStage, onStageSelect, compact = false }: NetworkGraphProps) {
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  // Extract layers from job result (when status is 'succeeded')
  const jobData = job as any
  const layers = job?.status === 'succeeded' ? (jobData.layers || []) : []

  // Helper to find layer by stage
  const findLayerByStage = (stage: string | null) => {
    if (!stage) return null
    return layers.find((l: any) => l.stage === stage) || null
  }

  // Handle node click - find stage for the layer and select it
  const handleNodeClick = (layerName: string | null) => {
    if (!layerName) {
      onStageSelect(null)
      return
    }
    const layer = layers.find((l: any) => l.name === layerName)
    if (layer && layer.stage) {
      onStageSelect(layer.stage)
    } else {
      onStageSelect(null)
    }
  }

  // Handle mouse move for tooltip positioning
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY })
  }

  // Handle mouse leave to hide tooltip
  const handleMouseLeave = () => {
    setHoveredLayer(null)
    setTooltipPosition(null)
  }

  // Get tooltip text for a layer
  const getTooltipText = (layerName: string | null): string => {
    if (!layerName || layerName === 'Prediction') {
      return layerName || ''
    }
    const layer = layers.find((l: any) => l.name === layerName)
    if (layer) {
      const { shape } = layer
      return `${layerName}: ${shape.c}×${shape.h}×${shape.w}`
    }
    return layerName
  }

  if (!job || job.status !== 'succeeded' || layers.length === 0) {
    return (
      <div className={compact ? 'p-2' : 'p-4'}>
        <h2 className={compact ? 'text-sm font-semibold mb-2' : 'text-lg font-semibold mb-4'}>Network Architecture</h2>
        <div className={`bg-gray-100 rounded-lg ${compact ? 'p-4 min-h-[60px]' : 'p-8 min-h-[120px]'} flex items-center justify-center`}>
          <p className={`text-gray-500 ${compact ? 'text-xs' : ''}`}>Network graph will be displayed when job completes</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${compact ? 'p-2' : 'p-4'} relative`}>
      <h2 className={compact ? 'text-sm font-semibold mb-2' : 'text-lg font-semibold mb-4'}>Network Architecture</h2>
      <div className={`bg-gray-50 rounded-lg ${compact ? 'p-3' : 'p-6'} overflow-x-auto`}>
        <div className={`flex items-center ${compact ? 'gap-2' : 'gap-4'} min-w-max`} onMouseLeave={handleMouseLeave}>
          {/* Input node */}
          <div className="flex items-center">
            <div
              className={`
                relative ${compact ? 'px-2 py-1' : 'px-4 py-2'} rounded-lg border-2 transition-all
                bg-gray-100 text-gray-700 border-gray-300
              `}
            >
              <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold whitespace-nowrap`}>Input</div>
              {!compact && (
                <div className="text-xs opacity-75 mt-0.5 text-center">
                  <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Connector after Input */}
          <div className="flex items-center mx-2">
            <div className="w-8 h-0.5 bg-gray-400"></div>
            <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-400"></div>
          </div>

          {/* Layer nodes */}
          {layers.map((layer: any, index: number) => {
            const isSelected = selectedStage === layer.stage
            const isHovered = hoveredLayer === layer.name
            const shapeStr = `${layer.shape.c}×${layer.shape.h}×${layer.shape.w}`

            return (
              <div key={layer.name} className="flex items-center">
                {/* Node */}
                <div
                  className={`
                    relative ${compact ? 'px-2 py-1' : 'px-4 py-2'} rounded-lg border-2 transition-all cursor-pointer
                    ${isSelected
                      ? 'bg-blue-600 text-white border-blue-700 shadow-lg scale-105'
                      : isHovered
                      ? 'bg-blue-100 text-blue-900 border-blue-300 shadow-md scale-105'
                      : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400 hover:shadow-sm'
                    }
                  `}
                  onClick={() => handleNodeClick(layer.name)}
                  onMouseEnter={(e) => {
                    setHoveredLayer(layer.name)
                    handleMouseMove(e)
                  }}
                  onMouseMove={handleMouseMove}
                >
                  <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold whitespace-nowrap`}>{layer.name}</div>
                  {!compact && <div className="text-xs opacity-75 mt-0.5">{shapeStr}</div>}
                </div>

                {/* Connector line (except after last layer) */}
                {index < layers.length - 1 && (
                  <div className="flex items-center mx-2">
                    <div className="w-8 h-0.5 bg-gray-400"></div>
                    <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-400"></div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Connector line before Prediction node */}
          {layers.length > 0 && (
            <div className="flex items-center mx-2">
              <div className="w-8 h-0.5 bg-gray-400"></div>
              <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-400"></div>
            </div>
          )}

          {/* Prediction node */}
          <div className="flex items-center">
            <div
              className={`
                relative ${compact ? 'px-2 py-1' : 'px-4 py-2'} rounded-lg border-2 transition-all cursor-pointer
                ${hoveredLayer === 'Prediction'
                  ? 'bg-green-100 text-green-900 border-green-300 shadow-md scale-105'
                  : 'bg-white text-gray-800 border-gray-300 hover:border-green-400 hover:shadow-sm'
                }
              `}
              onClick={() => handleNodeClick(null)} // Prediction doesn't map to a stage
              onMouseEnter={(e) => {
                setHoveredLayer('Prediction')
                handleMouseMove(e)
              }}
              onMouseMove={handleMouseMove}
            >
              <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold whitespace-nowrap`}>Prediction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredLayer && tooltipPosition && (
        <div
          className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 40}px`,
          }}
        >
          {getTooltipText(hoveredLayer)}
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  )
}

