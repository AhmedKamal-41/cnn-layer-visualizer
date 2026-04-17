'use client'

import { useState } from 'react'

interface GradCAMControlsProps {
  topK: number
  camLayers: string[]
  availableLayers: string[]
  onTopKChange: (k: number) => void
  onLayersChange: (layers: string[]) => void
  onApply: () => void
  disabled?: boolean
}

export default function GradCAMControls({
  topK,
  camLayers,
  availableLayers,
  onTopKChange,
  onLayersChange,
  onApply,
  disabled = false,
}: GradCAMControlsProps) {
  const handleLayerToggle = (layerName: string) => {
    if (camLayers.includes(layerName)) {
      onLayersChange(camLayers.filter((l) => l !== layerName))
    } else {
      onLayersChange([...camLayers, layerName])
    }
  }

  return (
    <div className="p-4 border-b bg-gray-50">
      <h3 className="text-sm font-semibold mb-3 text-gray-700">Grad-CAM Settings</h3>
      
      <div className="space-y-4">
        {/* Top-K selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Top-K Classes: {topK}
          </label>
          <select
            value={topK}
            onChange={(e) => onTopKChange(parseInt(e.target.value, 10))}
            disabled={disabled}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {[1, 2, 3, 4, 5].map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        
        {/* Layer checkboxes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Layers to Include:
          </label>
          <div className="flex flex-wrap gap-3">
            {availableLayers.map((layerName) => (
              <label
                key={layerName}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={camLayers.includes(layerName)}
                  onChange={() => handleLayerToggle(layerName)}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-700">{layerName}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Apply button */}
        <button
          onClick={onApply}
          disabled={disabled || camLayers.length === 0}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Apply Settings
        </button>
      </div>
    </div>
  )
}
