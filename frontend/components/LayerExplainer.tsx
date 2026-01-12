'use client'

interface LayerExplainerProps {
  layerName: string | null
  layerStage: string | null
}

export default function LayerExplainer({ layerName, layerStage }: LayerExplainerProps) {
  // Get educational subtitle based on layer name/stage
  const getSubtitle = (): string => {
    if (!layerName && !layerStage) {
      return 'Select a layer from the architecture bar or left sidebar.'
    }

    const name = layerName?.toLowerCase() || ''
    const stage = layerStage?.toLowerCase() || ''

    if (name === 'conv1' || stage === 'conv1') {
      return 'Detects edges and simple textures.'
    }
    if (name.includes('layer1') || stage.includes('layer1') || stage.includes('stage1')) {
      return 'Combines edges into small patterns.'
    }
    if (name.includes('layer2') || stage.includes('layer2') || stage.includes('stage2')) {
      return 'Builds object parts (fur, legs, shapes).'
    }
    if (name.includes('layer3') || stage.includes('layer3') || stage.includes('stage3')) {
      return 'Builds larger parts and structures.'
    }
    if (name.includes('layer4') || stage.includes('layer4') || stage.includes('stage4')) {
      return 'High-level concepts, close to final decision.'
    }
    if (name === 'prediction' || stage === 'prediction') {
      return 'Final class probabilities.'
    }

    return 'Explore the feature maps to see what this layer detects.'
  }

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Layer: {layerName || layerStage || 'Select a layer'}
      </h1>
      <p className="text-gray-600 text-lg">{getSubtitle()}</p>
    </div>
  )
}

