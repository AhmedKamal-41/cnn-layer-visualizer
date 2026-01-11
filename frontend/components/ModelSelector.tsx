'use client'

import { useEffect, useState } from 'react'
import { getModels } from '@/lib/api'

interface Model {
  id: string
  display_name: string
  input_size: number[]
}

interface ModelSelectorProps {
  selectedModel: string | null
  onModelChange: (modelId: string) => void
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true)
        setError(null)
        const modelsData = await getModels()
        setModels(modelsData)
      } catch (err) {
        console.error('Failed to fetch models:', err)
        setError('Failed to load models')
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [])

  return (
    <div className="w-full">
      <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-2">
        Select Model
      </label>
      <select
        id="model-select"
        value={selectedModel || ''}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={loading || models.length === 0}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">{loading ? 'Loading models...' : 'Choose a model'}</option>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.display_name}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
