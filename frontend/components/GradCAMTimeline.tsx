'use client'

import { JobResponse, GradCAMInfo, getImageUrl } from '@/lib/api'

interface GradCAMTimelineProps {
  job: JobResponse | null
  selectedStage?: string | null
}

export default function GradCAMTimeline({ job, selectedStage }: GradCAMTimelineProps) {
  // Extract gradcam data from job
  const jobData = job as any
  const gradcam: GradCAMInfo | undefined = jobData?.gradcam
  const topPrediction = jobData?.prediction?.topk?.[0]

  // Only show if gradcam exists and top prediction exists
  if (!gradcam || !gradcam.classes || gradcam.classes.length === 0 || !topPrediction) {
    return null
  }

  // Find the matching class in gradcam for the top prediction
  const classInfo = gradcam.classes.find((c) => c.class_id === topPrediction.class_id)

  if (!classInfo) {
    return null
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Why the model thinks this class
        </h2>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg font-semibold text-gray-900">{classInfo.class_name}</span>
          <span className="text-sm text-gray-600">
            ({(classInfo.prob * 100).toFixed(1)}% probability)
          </span>
        </div>
      </div>

      {/* Single row with images across layers */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {gradcam.layers.map((layerName) => {
          const overlay = classInfo.overlays.find((o) => o.layer === layerName)
          return (
            <div key={layerName} className="flex-shrink-0 text-center">
              {overlay ? (
                <>
                  <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden shadow-sm border border-gray-200 flex items-center justify-center">
                    <img
                      src={getImageUrl(overlay.url)}
                      alt={`Grad-CAM for ${classInfo.class_name} at ${layerName}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        if (target.parentElement) {
                          const placeholder = document.createElement('div')
                          placeholder.className = 'w-full h-full flex items-center justify-center text-gray-400 text-xs'
                          placeholder.textContent = 'Failed to load'
                          target.parentElement.appendChild(placeholder)
                        }
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-700">{layerName}</p>
                </>
              ) : (
                <div className="w-32 h-32 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">N/A</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Caption */}
      <p className="mt-4 text-sm text-gray-600 text-center italic">
        Early layers detect basic features → Late layers focus on decision regions
      </p>

      {/* Warnings */}
      {gradcam.warnings && gradcam.warnings.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-semibold text-yellow-800 mb-1">Warnings:</p>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            {gradcam.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

