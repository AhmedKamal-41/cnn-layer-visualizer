'use client'

import { Job } from '@/types'

interface ComparePanelProps {
  job: Job
  selectedLayer: string | null
}

export default function ComparePanel({ job, selectedLayer }: ComparePanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Job Information</h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-700">Model:</span>{' '}
            <span className="text-gray-600">{job.model_id}</span>
          </div>
          {job.created_at && (
            <div>
              <span className="font-medium text-gray-700">Created:</span>{' '}
              <span className="text-gray-600">
                {new Date(job.created_at).toLocaleString()}
              </span>
            </div>
          )}
          {job.completed_at && (
            <div>
              <span className="font-medium text-gray-700">Completed:</span>{' '}
              <span className="text-gray-600">
                {new Date(job.completed_at).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {selectedLayer && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Layer Details</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Layer:</span>{' '}
              <span className="font-mono text-gray-600">{selectedLayer}</span>
            </div>
            {/* TODO: Add layer statistics, activation stats, etc. */}
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">
                Layer statistics and activation information will be displayed here
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Compare Layers</h2>
        <div className="space-y-2">
          {/* TODO: Implement layer comparison UI */}
          <p className="text-sm text-gray-500">
            Compare activations between different layers
          </p>
          <button
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
            disabled
          >
            Compare (Coming soon)
          </button>
        </div>
      </div>
    </div>
  )
}

