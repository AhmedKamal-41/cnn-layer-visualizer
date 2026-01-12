/**
 * React hook to load and cache ImageNet class index for label mapping.
 */

import { useState, useEffect } from 'react'
import { LabelMap } from './labels'

// Module-level cache
let cachedMap: LabelMap | null = null
let isLoading = false
let loadPromise: Promise<LabelMap | null> | null = null

/**
 * Load ImageNet class index from public directory.
 * Caches the result in module-level variable.
 */
async function loadImageNetIndex(): Promise<LabelMap | null> {
  // Return cached if available
  if (cachedMap) {
    return cachedMap
  }

  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise
  }

  // Start loading
  loadPromise = (async () => {
    try {
      const response = await fetch('/labels/imagenet_class_index.json')
      if (!response.ok) {
        console.warn('Failed to load ImageNet class index:', response.status)
        return null
      }

      const classIndex = await response.json()

      // Convert from {"0": ["n10000000", "tench"], ...} to {"0": "tench", ...}
      const map: LabelMap = {}
      for (const [classId, classData] of Object.entries(classIndex)) {
        if (Array.isArray(classData) && classData.length >= 2) {
          map[classId] = classData[1] // classData[1] is the human-readable name
        }
      }

      cachedMap = map
      console.debug(`Loaded ${Object.keys(map).length} ImageNet class names`)
      return map
    } catch (error) {
      console.warn('Error loading ImageNet class index:', error)
      return null
    } finally {
      loadPromise = null
      isLoading = false
    }
  })()

  return loadPromise
}

/**
 * Hook to get ImageNet label map.
 * Returns null if not loaded yet (non-blocking).
 */
export function useLabelMap(): LabelMap | null {
  const [map, setMap] = useState<LabelMap | null>(cachedMap)

  useEffect(() => {
    if (cachedMap) {
      setMap(cachedMap)
      return
    }

    loadImageNetIndex().then((loadedMap) => {
      if (loadedMap) {
        setMap(loadedMap)
      }
    })
  }, [])

  return map
}
