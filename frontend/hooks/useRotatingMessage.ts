import { useState, useEffect } from 'react'

const LOADING_MESSAGES = [
  'Warming up filters…',
  'Extracting feature maps…',
  'Painting Grad-CAM heat…',
  'Almost there…',
]

interface UseRotatingMessageOptions {
  messages?: string[]
  interval?: number // ms between message changes
  enabled?: boolean
}

export function useRotatingMessage(options: UseRotatingMessageOptions = {}) {
  const {
    messages = LOADING_MESSAGES,
    interval = 1500,
    enabled = true,
  } = options
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(messages[0] || '')

  useEffect(() => {
    if (!enabled || messages.length === 0) {
      return
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % messages.length
        setCurrentMessage(messages[next])
        return next
      })
    }, interval)

    return () => {
      clearInterval(timer)
    }
  }, [enabled, interval, messages])

  // Reset message when enabled changes
  useEffect(() => {
    if (enabled && messages.length > 0) {
      setCurrentIndex(0)
      setCurrentMessage(messages[0])
    }
  }, [enabled, messages])

  return currentMessage
}

