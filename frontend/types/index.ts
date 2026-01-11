/**
 * TypeScript type definitions
 */

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface Model {
  id: string
  name: string
  description?: string
  type?: string
  input_size?: [number, number]
  num_classes?: number
}

export interface Layer {
  id: string
  name: string
  type: string
  shape?: number[]
  parameters?: number
}

export interface FeatureMap {
  layer_id: string
  channel: number
  url: string
  shape: [number, number]
}

export interface Job {
  job_id: string
  status: JobStatus
  model_id: string
  created_at?: string
  completed_at?: string
  error?: string
  results?: {
    layer_names?: string[]
    feature_maps?: Record<string, string[]>
    predictions?: any[]
    network_architecture?: {
      layers: Layer[]
      connections: Array<{ from: string; to: string }>
    }
  }
}

export interface NetworkArchitecture {
  layers: Layer[]
  connections: Array<{
    from: string
    to: string
  }>
}

export interface LayerStatistics {
  layer_id: string
  activation_stats: {
    mean: number
    std: number
    min: number
    max: number
  }
  feature_map_count: number
}

