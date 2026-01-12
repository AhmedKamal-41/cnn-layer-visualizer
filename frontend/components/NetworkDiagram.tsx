'use client'

import { useRef, useState, useEffect, useMemo } from 'react'

interface NetworkDiagramProps {
  layers: Array<{ name: string; stage: string | null; shape?: { c: number; h: number; w: number } }>
  selectedStage: string | null
  onLayerSelect: (stage: string | null) => void
  inputImageUrl?: string
  predictionLabel?: string
  predictionProb?: number
}

interface NodePosition {
  x: number
  y: number
}

interface Connection {
  x1: number
  y1: number
  x2: number
  y2: number
  opacity: number
}

export default function NetworkDiagram({
  layers,
  selectedStage,
  onLayerSelect,
  inputImageUrl,
  predictionLabel,
  predictionProb,
}: NetworkDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 200 })
  const [hoveredStage, setHoveredStage] = useState<string | null>(null)

  // Setup ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({ width: Math.max(width, 1200), height: Math.max(height, 200) })
      }
    })

    resizeObserver.observe(containerRef.current)

    // Initial measurement
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDimensions({ width: Math.max(rect.width, 1200), height: Math.max(rect.height, 200) })
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Layout calculations
  const layout = useMemo(() => {
    if (layers.length === 0) {
      return {
        columns: [],
        connections: [],
        nodeRadius: 8,
        labelY: dimensions.height * 0.85,
        leftCard: null,
        rightCard: null,
        arrows: [],
      }
    }

    const { width, height } = dimensions
    const padding = 40
    const leftCardWidth = 220
    const leftCardHeight = 160
    const rightCardWidth = 240
    const rightCardHeight = 160
    const gap = 40

    // Calculate network region
    const networkStartX = padding + leftCardWidth + gap
    const rightCardX = width - padding - rightCardWidth
    const networkEndX = rightCardX - gap
    const columnSpacing = layers.length > 1 ? (networkEndX - networkStartX) / (layers.length - 1) : 0

    // Node configuration
    const nodeRadius = 8
    const nodesPerColumn = 6
    const bandTop = height * 0.2
    const bandHeight = height * 0.5
    const nodeSpacing = bandHeight / (nodesPerColumn - 1)
    const centerY = height / 2

    // Calculate column positions and node positions
    const columns: Array<{ x: number; nodes: NodePosition[]; layer: typeof layers[0] }> = []
    layers.forEach((layer, colIndex) => {
      const x = networkStartX + colIndex * columnSpacing
      const nodes: NodePosition[] = []
      for (let i = 0; i < nodesPerColumn; i++) {
        nodes.push({
          x,
          y: bandTop + i * nodeSpacing,
        })
      }
      columns.push({ x, nodes, layer })
    })

    // Calculate arrow positions
    const arrows: Array<{ path: string; x1: number; y1: number; x2: number; y2: number }> = []
    if (columns.length > 0) {
      const firstColumnCenterY = bandTop + bandHeight / 2
      const lastColumnCenterY = bandTop + bandHeight / 2

      // Arrow A: from left card to first column
      const arrowAStartX = padding + leftCardWidth
      const arrowAStartY = centerY
      const arrowAEndX = networkStartX
      const arrowAEndY = firstColumnCenterY
      const arrowAControlX = arrowAStartX + (arrowAEndX - arrowAStartX) * 0.5
      const arrowAControlY = arrowAStartY

      arrows.push({
        path: `M ${arrowAStartX} ${arrowAStartY} Q ${arrowAControlX} ${arrowAControlY} ${arrowAEndX} ${arrowAEndY}`,
        x1: arrowAStartX,
        y1: arrowAStartY,
        x2: arrowAEndX,
        y2: arrowAEndY,
      })

      // Arrow B: from last column to right card
      const arrowBStartX = networkEndX
      const arrowBStartY = lastColumnCenterY
      const arrowBEndX = rightCardX
      const arrowBEndY = centerY
      const arrowBControlX = arrowBStartX + (arrowBEndX - arrowBStartX) * 0.5
      const arrowBControlY = arrowBStartY

      arrows.push({
        path: `M ${arrowBStartX} ${arrowBStartY} Q ${arrowBControlX} ${arrowBControlY} ${arrowBEndX} ${arrowBEndY}`,
        x1: arrowBStartX,
        y1: arrowBStartY,
        x2: arrowBEndX,
        y2: arrowBEndY,
      })
    }

    // Calculate connections between adjacent columns
    const connections: Connection[] = []
    for (let colIndex = 0; colIndex < columns.length - 1; colIndex++) {
      const col1 = columns[colIndex]
      const col2 = columns[colIndex + 1]
      const isCol1Selected = col1.layer.stage === selectedStage
      const isCol2Selected = col2.layer.stage === selectedStage
      const isCol1Hovered = col1.layer.stage === hoveredStage
      const isCol2Hovered = col2.layer.stage === hoveredStage

      // Determine connection opacity
      let opacity = 0.12
      if (isCol1Selected || isCol2Selected) {
        opacity = 0.3
      } else if (isCol1Hovered || isCol2Hovered) {
        opacity = 0.2
      }

      // Connect every node in col1 to every node in col2
      col1.nodes.forEach((node1) => {
        col2.nodes.forEach((node2) => {
          connections.push({
            x1: node1.x,
            y1: node1.y,
            x2: node2.x,
            y2: node2.y,
            opacity,
          })
        })
      })
    }

    return {
      columns,
      connections,
      nodeRadius,
      labelY: height * 0.85,
      leftCard: {
        x: padding,
        y: (height - leftCardHeight) / 2,
        width: leftCardWidth,
        height: leftCardHeight,
      },
      rightCard: {
        x: rightCardX,
        y: (height - rightCardHeight) / 2,
        width: rightCardWidth,
        height: rightCardHeight,
      },
      arrows,
    }
  }, [dimensions, layers, selectedStage, hoveredStage])

  const handleColumnClick = (layer: typeof layers[0]) => {
    if (layer.stage) {
      onLayerSelect(layer.stage)
    }
  }

  if (layers.length === 0) {
    return null
  }

  return (
    <div className="w-full overflow-x-auto">
      <div ref={containerRef} className="bg-gradient-to-b from-slate-50 to-white rounded-lg" style={{ minWidth: '1200px' }}>
      <svg
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-48"
        style={{ minWidth: '1200px' }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
          </linearGradient>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#d1d5db" />
          </marker>
        </defs>

          {/* Background gradient */}
          <rect width={dimensions.width} height={dimensions.height} fill="url(#bgGradient)" />

          {/* Left Input Card */}
          {layout.leftCard && (
            <foreignObject
              x={layout.leftCard.x}
              y={layout.leftCard.y}
              width={layout.leftCard.width}
              height={layout.leftCard.height}
            >
              <div className="border border-gray-200 rounded-lg shadow-sm bg-white p-4 h-full flex flex-col">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Input</h3>
                {inputImageUrl ? (
                  <div className="flex-1 rounded overflow-hidden bg-gray-50">
                    <img
                      src={inputImageUrl}
                      alt="Input image"
                      className="w-full h-full object-contain"
                      style={{ maxHeight: '120px' }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 rounded border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                    <p className="text-xs text-gray-500 text-center px-2">Upload an image</p>
                  </div>
                )}
              </div>
            </foreignObject>
          )}

          {/* Right Prediction Card */}
          {layout.rightCard && (
            <foreignObject
              x={layout.rightCard.x}
              y={layout.rightCard.y}
              width={layout.rightCard.width}
              height={layout.rightCard.height}
            >
              <div className="border border-gray-200 rounded-lg shadow-sm bg-white p-4 h-full flex flex-col">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Prediction</h3>
                {predictionLabel && predictionProb !== undefined ? (
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="text-lg font-bold text-gray-900 truncate mb-2">{predictionLabel}</div>
                    <div className="text-2xl font-bold text-blue-600">{(predictionProb * 100).toFixed(1)}%</div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-gray-500">Prediction pending</p>
                  </div>
                )}
              </div>
            </foreignObject>
          )}

          {/* Arrows */}
          {layout.arrows.map((arrow, idx) => (
            <path
              key={idx}
              d={arrow.path}
              stroke="#d1d5db"
              strokeWidth="2"
              fill="none"
              opacity="0.8"
              markerEnd="url(#arrowhead)"
            />
          ))}

            {/* Connections layer (render first, so nodes appear on top) */}
          <g className="connections">
            {layout.connections.map((conn, idx) => (
              <line
                key={idx}
                x1={conn.x1}
                y1={conn.y1}
                x2={conn.x2}
                y2={conn.y2}
                stroke="#6b7280"
                strokeWidth="1"
                opacity={conn.opacity}
              />
            ))}
          </g>

          {/* Columns with nodes and labels */}
          {layout.columns.map((column, colIndex) => {
          const isSelected = column.layer.stage === selectedStage
          const isHovered = column.layer.stage === hoveredStage
          const shapeStr = column.layer.shape
            ? `${column.layer.shape.c}×${column.layer.shape.h}×${column.layer.shape.w}`
            : ''

          // Node styling based on state
          let nodeStroke = '#9ca3af'
          let nodeStrokeWidth = 1.5
          let nodeFilter = ''
          if (isSelected) {
            nodeStroke = '#3b82f6'
            nodeStrokeWidth = 2.5
            nodeFilter = 'url(#glow)'
          } else if (isHovered) {
            nodeStroke = '#60a5fa'
            nodeStrokeWidth = 2
          }

          return (
            <g
              key={column.layer.stage || colIndex}
              className="column-group cursor-pointer"
              onClick={() => handleColumnClick(column.layer)}
              onMouseEnter={() => setHoveredStage(column.layer.stage)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              {/* Nodes */}
              {column.nodes.map((node, nodeIndex) => (
                <circle
                  key={nodeIndex}
                  cx={node.x}
                  cy={node.y}
                  r={layout.nodeRadius}
                  fill="white"
                  stroke={nodeStroke}
                  strokeWidth={nodeStrokeWidth}
                  filter={nodeFilter}
                  className="transition-all duration-200"
                />
              ))}

              {/* Label */}
              <text
                x={column.x}
                y={layout.labelY}
                textAnchor="middle"
                fill="#374151"
                fontSize="12"
                fontWeight={isSelected ? 'bold' : 'normal'}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {column.layer.name}
              </text>

              {/* Shape info (smaller, below name) */}
              {shapeStr && (
                <text
                  x={column.x}
                  y={layout.labelY + 14}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize="10"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {shapeStr}
                </text>
              )}
            </g>
          )
        })}
        </svg>
      </div>
    </div>
  )
}

