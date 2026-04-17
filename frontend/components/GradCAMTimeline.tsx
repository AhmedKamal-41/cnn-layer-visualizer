'use client'

import { JobResponse, GradCAMInfo, getImageUrl } from '@/lib/api'
import LayerProgression from '@/components/viewer/LayerProgression'

interface GradCAMTimelineProps {
  job: JobResponse | null
  selectedStage?: string | null
}

export default function GradCAMTimeline({ job }: GradCAMTimelineProps) {
  const jobData = job as any
  const gradcam: GradCAMInfo | undefined = jobData?.gradcam
  const topPrediction = jobData?.prediction?.topk?.[0]

  if (!gradcam || !gradcam.classes || gradcam.classes.length === 0 || !topPrediction) {
    return null
  }

  const classInfo = gradcam.classes.find((c) => c.class_id === topPrediction.class_id)
  if (!classInfo) {
    return null
  }

  const layers = gradcam.layers
    .map((layerName) => {
      const overlay = classInfo.overlays.find((o) => o.layer === layerName)
      if (!overlay) return null
      return {
        name: layerName,
        overlayUrl: getImageUrl(overlay.url),
      }
    })
    .filter((l): l is { name: string; overlayUrl: string } => l !== null)

  if (layers.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <LayerProgression
        prediction={classInfo.class_name}
        confidence={classInfo.prob}
        layers={layers}
      />

      {gradcam.warnings && gradcam.warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900/50 dark:bg-yellow-950/30">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Warnings:</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
            {gradcam.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
