/**
 * Backend API client using fetch()
 */

// Get API base URL from environment or use relative path for local dev
// Next.js replaces NEXT_PUBLIC_* variables at build time with their actual values
declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string
  }
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Helper function to build API URLs
function getApiUrl(path: string): string {
  if (API_BASE_URL) {
    // Remove trailing slash from base URL if present
    const base = API_BASE_URL.replace(/\/$/, '')
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${base}${cleanPath}`
  }
  // Local dev: use relative path (will use Next.js rewrites)
  return path
}

/**
 * Convert relative image URLs to absolute URLs using API base URL
 * This is needed when frontend and backend are on different domains
 */
export function getImageUrl(relativeUrl: string): string {
  if (!relativeUrl) return relativeUrl
  // If it's already an absolute URL, return as-is
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl
  }
  // Use getApiUrl to convert relative path to absolute URL
  return getApiUrl(relativeUrl)
}

export interface CreateJobRequest {
  image: File
  model_id: string
}

export interface Model {
  id: string
  display_name: string
  input_size: number[]
}

export interface JobResponse {
  job_id: string
  model_id: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  progress: number
  message?: string
  created_at: string
  result?: any
}

export interface HealthResponse {
  status: string
}

export interface GradCAMOverlayInfo {
  layer: string
  url: string
}

export interface GradCAMClassInfo {
  class_id: number
  class_name: string
  prob: number
  overlays: GradCAMOverlayInfo[]
}

export interface GradCAMInfo {
  top_k: number
  classes: GradCAMClassInfo[]
  layers: string[]
  warnings?: string[]
}

/**
 * Get list of available models
 */
export async function getModels(): Promise<Model[]> {
  const response = await fetch(getApiUrl('/api/v1/models'))

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

/**
 * Create a new inference job
 */
export async function createJob(
  image: File,
  modelId: string,
  topK?: number,
  topKPreds?: number,
  topKCam?: number,
  camLayers?: string[]
): Promise<JobResponse> {
  const formData = new FormData()
  formData.append('image', image)
  formData.append('model_id', modelId)
  
  // New parameters: topKPreds and topKCam
  if (topKPreds !== undefined || topKCam !== undefined) {
    if (topKPreds !== undefined) {
      formData.append('top_k_preds', topKPreds.toString())
    }
    if (topKCam !== undefined) {
      formData.append('top_k_cam', topKCam.toString())
    }
  } else if (topK !== undefined) {
    // Backward compatibility: if only topK provided, use it for both
    formData.append('top_k', topK.toString())
  }
  
  if (camLayers !== undefined && camLayers.length > 0) {
    formData.append('cam_layers', camLayers.join(','))
  }

  const response = await fetch(getApiUrl('/api/v1/jobs'), {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

/**
 * Get job status by job_id
 */
export async function getJobStatus(jobId: string): Promise<JobResponse> {
  const response = await fetch(getApiUrl(`/api/v1/jobs/${jobId}`))

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Job ${jobId} not found`)
    }
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

/**
 * Health check endpoint
 */
export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(getApiUrl('/api/v1/health'))

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}
