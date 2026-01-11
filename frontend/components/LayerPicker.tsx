'use client'

import { useState, useMemo } from 'react'

interface LayerPickerProps {
  stages: string[]
  selectedStage: string | null
  onStageSelect: (stage: string | null) => void
}

export default function LayerPicker({ stages, selectedStage, onStageSelect }: LayerPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [pinnedStages, setPinnedStages] = useState<Set<string>>(new Set())

  // Filter and sort stages
  const filteredAndSortedStages = useMemo(() => {
    // Filter based on search query
    const filtered = searchQuery
      ? stages.filter((stage) => stage.toLowerCase().includes(searchQuery.toLowerCase()))
      : stages

    // Split into pinned and unpinned
    const pinned: string[] = []
    const unpinned: string[] = []

    filtered.forEach((stage) => {
      if (pinnedStages.has(stage)) {
        pinned.push(stage)
      } else {
        unpinned.push(stage)
      }
    })

    // Return pinned first, then unpinned
    return [...pinned, ...unpinned]
  }, [stages, searchQuery, pinnedStages])

  // Toggle pin state
  const togglePin = (stage: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent stage selection
    setPinnedStages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(stage)) {
        newSet.delete(stage)
      } else {
        newSet.add(stage)
      }
      return newSet
    })
  }

  // Star icon SVG (filled for pinned, outlined for unpinned)
  const StarIcon = ({ isPinned }: { isPinned: boolean }) => (
    <svg
      className={`w-4 h-4 ${isPinned ? 'text-yellow-500 fill-current' : 'text-gray-400'}`}
      fill={isPinned ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  )

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Stages</h2>
      
      {/* Search Box */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search stages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Stage List */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        {filteredAndSortedStages.length === 0 ? (
          <div className="text-center py-12 px-4">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700 mb-1">
              {searchQuery ? 'No stages match your search' : 'No stages available'}
            </p>
            {!searchQuery && (
              <p className="text-xs text-gray-500">
                Stages will appear once the job completes processing
              </p>
            )}
          </div>
        ) : (
          filteredAndSortedStages.map((stage) => {
            const isPinned = pinnedStages.has(stage)
            const isSelected = selectedStage === stage

            return (
              <button
                key={stage}
                onClick={() => onStageSelect(stage === selectedStage ? null : stage)}
                className={`
                  w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between gap-2
                  ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }
                `}
              >
                <span className="text-sm font-semibold flex-1 truncate">{stage}</span>
                <button
                  onClick={(e) => togglePin(stage, e)}
                  className={`
                    flex-shrink-0 p-1 rounded hover:bg-opacity-20 transition-colors
                    ${isSelected ? 'hover:bg-white' : 'hover:bg-gray-300'}
                  `}
                  title={isPinned ? 'Unpin stage' : 'Pin stage'}
                >
                  <StarIcon isPinned={isPinned} />
                </button>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

