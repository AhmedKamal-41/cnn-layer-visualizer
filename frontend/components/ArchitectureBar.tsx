'use client'

import { JobResponse } from '@/lib/api'

interface ArchitectureBarProps {
  job: JobResponse | null
  selectedStage: string | null
  onLayerSelect: (stage: string | null) => void
}

export default function ArchitectureBar({ job, selectedStage, onLayerSelect }: ArchitectureBarProps) {
  // Extract layers from job data
  const jobData = job as any
  const layers = job?.status === 'succeeded' ? (jobData.layers || []) : []
  
  // Get top-1 prediction for display
  const topPrediction = job?.status === 'succeeded' ? jobData?.prediction?.topk?.[0] : null
  const predictionLabel = topPrediction?.class_name || null
  const predictionPercent = topPrediction?.prob != null ? (topPrediction.prob * 100).toFixed(1) : null

  if (!job || job.status !== 'succeeded' || layers.length === 0) {
    return null
  }

  // Sort layers to show in order: conv1, layer1, layer2, layer3, layer4, prediction
  const orderedLayers = [...layers].sort((a: any, b: any) => {
    const order: Record<string, number> = {
      conv1: 0,
      layer1: 1,
      layer2: 2,
      layer3: 3,
      layer4: 4,
      prediction: 5,
    }
    const aOrder = order[a.name] ?? order[a.stage] ?? 999
    const bOrder = order[b.name] ?? order[b.stage] ?? 999
    return aOrder - bOrder
  })

  const handleLayerClick = (layer: any) => {
    if (layer.stage) {
      onLayerSelect(layer.stage)
    }
  }

  return (
    <div className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {orderedLayers.map((layer: any, index: number) => {
          const isSelected = selectedStage === layer.stage
          const shapeStr = layer.shape
            ? `${layer.shape.c}×${layer.shape.h}×${layer.shape.w}`
            : ''

          return (
            <div key={layer.stage || layer.name || index} className="flex items-center">
              <button
                onClick={() => handleLayerClick(layer)}
                className={`
                  px-4 py-2 rounded-lg transition-all text-sm font-medium
                  ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  <span>{layer.name || layer.stage || 'Unknown'}</span>
                  {shapeStr && (
                    <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                      {shapeStr}
                    </span>
                  )}
                </div>
              </button>
              <span className="mx-2 text-gray-400 text-lg">→</span>
            </div>
          )
        })}
        {/* Prediction node */}
        <div className="flex items-center">
          <div className={`
            px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-900 border-2 border-green-300
          `}>
            <div className="flex flex-col items-center gap-1">
              <span className="font-semibold whitespace-nowrap">
                {predictionLabel && predictionPercent
                  ? `Prediction: ${predictionLabel} (${predictionPercent}%)`
                  : 'Prediction'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center mt-3">
        Click a layer to see what the CNN learns at that stage.
      </p>
    </div>
  )
}

