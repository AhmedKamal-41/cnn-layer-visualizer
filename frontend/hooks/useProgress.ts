import { useState, useEffect, useRef, useCallback } from 'react'

interface UseProgressOptions {
  interval?: number // ms between updates
  enabled?: boolean // whether to run the timer
}

export function useProgress(options: UseProgressOptions = {}) {
  const { interval = 120, enabled = true } = options
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const updateProgress = useCallback(() => {
    setProgress((current) => {
      let delta = 0
      
      if (current < 60) {
        // Fast progress: 3-6 per interval
        delta = 3 + Math.random() * 3
      } else if (current < 85) {
        // Medium progress: 1-3 per interval
        delta = 1 + Math.random() * 2
      } else if (current < 99) {
        // Slow progress: 0.2-0.8 per interval
        delta = 0.2 + Math.random() * 0.6
      }
      
      // Cap at 99% until manually set to 100
      return Math.min(99, current + delta)
    })
  }, [])

  useEffect(() => {
    if (enabled) {
      // Reset progress when enabled
      setProgress(0)
      
      // Start the timer
      intervalRef.current = setInterval(updateProgress, interval)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } else {
      // Clear interval when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval, updateProgress])

  // Manual control functions
  const resetProgress = useCallback(() => {
    setProgress(0)
  }, [])

  const setProgressManually = useCallback((value: number) => {
    setProgress(value)
    // Clear interval when manually setting to 100
    if (value >= 100 && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  return {
    progress,
    setProgress: setProgressManually,
    resetProgress,
  }
}

