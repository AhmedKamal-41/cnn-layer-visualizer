'use client'

import { JobResponse } from '@/lib/api'

interface RightDetailsPanelProps {
  job: JobResponse
  selectedStage: string | null
}

export default function RightDetailsPanel({ job, selectedStage }: RightDetailsPanelProps) {
  const jobData = job as any
  const predictions = jobData.prediction?.topk || []
  const selectedLayerData = jobData.layers?.find((l: any) => l.stage === selectedStage)

  const formatProbability = (prob: number) => {
    return `${(prob * 100).toFixed(2)}%`
  }

  return (
    <div className="w-80 border-l bg-white overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Predictions Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Predictions</h2>
          {predictions.length > 0 ? (
            <div className="space-y-2">
              {predictions.map((pred: any, index: number) => (
                <div
                  key={pred.class_id || index}
                  className={`p-3 rounded-lg border ${
                    index === 0
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {index + 1}. {pred.class_name || `Class ${pred.class_id}`}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {formatProbability(pred.prob)}
                    </span>
                  </div>
                  {pred.class_id !== undefined && (
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {pred.class_id}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              No predictions available
            </div>
          )}
        </div>

        {/* Selected Layer Info */}
        {selectedLayerData && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Layer Details</h2>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Layer Name
                </span>
                <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">
                  <code className="text-sm text-gray-900 font-mono">{selectedLayerData.name}</code>
                </div>
              </div>
              {selectedLayerData.shape && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Shape
                  </span>
                  <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Channels:</span>
                      <span className="font-mono font-semibold text-gray-900">
                        {selectedLayerData.shape.c}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Height:</span>
                      <span className="font-mono font-semibold text-gray-900">
                        {selectedLayerData.shape.h}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Width:</span>
                      <span className="font-mono font-semibold text-gray-900">
                        {selectedLayerData.shape.w}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Job Info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Model:</span>{' '}
              <span className="text-gray-600">{job.model_id}</span>
            </div>
            {jobData.created_at && (
              <div>
                <span className="font-medium text-gray-700">Created:</span>{' '}
                <span className="text-gray-600">
                  {new Date(jobData.created_at).toLocaleString()}
                </span>
              </div>
            )}
            {jobData.completed_at && (
              <div>
                <span className="font-medium text-gray-700">Completed:</span>{' '}
                <span className="text-gray-600">
                  {new Date(jobData.completed_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
