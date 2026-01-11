'use client'

import { JobResponse } from '@/lib/api'

interface JobStatusBannerProps {
  job: JobResponse
}

const statusColors: Record<string, string> = {
  queued: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  running: 'bg-blue-100 text-blue-800 border-blue-300',
  succeeded: 'bg-green-100 text-green-800 border-green-300',
  failed: 'bg-red-100 text-red-800 border-red-300',
}

export default function JobStatusBanner({ job }: JobStatusBannerProps) {
  const statusColor = statusColors[job.status] || statusColors.queued
  const isProcessing = job.status === 'queued' || job.status === 'running'

  return (
    <div className={`border-b px-4 py-3 ${statusColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <span className="font-semibold">Status:</span>
          <span className="uppercase tracking-wide">{job.status}</span>
          {isProcessing && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              <span className="text-sm">{job.message || 'Processing...'}</span>
            </div>
          )}
          {job.status === 'succeeded' && (
            <span className="text-sm">{job.message || 'Completed'}</span>
          )}
          {job.status === 'failed' && job.message && (
            <span className="text-sm">{job.message}</span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {/* Progress Bar */}
          {isProcessing && (
            <div className="flex items-center space-x-2 min-w-[200px]">
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <span className="text-sm font-medium w-12 text-right">{job.progress}%</span>
            </div>
          )}
          <div className="text-sm">
            Job ID: <span className="font-mono">{job.job_id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

