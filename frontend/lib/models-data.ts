export type ModelFamily = "ResNet" | "MobileNet" | "EfficientNet" | "DenseNet" | "ConvNeXt" | "ShuffleNet";

export type ModelInfo = {
  id: string;
  name: string;
  short: string;
  family: ModelFamily;
  accuracy: number;
  latencyMs: number;
  paramsM: number;
};

export const MODELS: ModelInfo[] = [
  { id: "resnet18",           name: "ResNet-18",          short: "ResNet-18",   family: "ResNet",       accuracy: 69.8, latencyMs: 30,  paramsM: 11.7 },
  { id: "resnet50",           name: "ResNet-50",          short: "ResNet-50",   family: "ResNet",       accuracy: 80.9, latencyMs: 80,  paramsM: 25.6 },
  { id: "mobilenet_v2",       name: "MobileNet V2",       short: "MobV2",       family: "MobileNet",    accuracy: 72.2, latencyMs: 25,  paramsM: 3.5  },
  { id: "mobilenet_v3_small", name: "MobileNet V3 Small", short: "MobV3-S",     family: "MobileNet",    accuracy: 67.7, latencyMs: 15,  paramsM: 2.5  },
  { id: "mobilenet_v3_large", name: "MobileNet V3 Large", short: "MobV3-L",     family: "MobileNet",    accuracy: 75.3, latencyMs: 30,  paramsM: 5.5  },
  { id: "efficientnet_b0",    name: "EfficientNet-B0",    short: "EffNet-B0",   family: "EfficientNet", accuracy: 77.7, latencyMs: 40,  paramsM: 5.3  },
  { id: "efficientnet_b2",    name: "EfficientNet-B2",    short: "EffNet-B2",   family: "EfficientNet", accuracy: 80.6, latencyMs: 70,  paramsM: 9.1  },
  { id: "efficientnet_b3",    name: "EfficientNet-B3",    short: "EffNet-B3",   family: "EfficientNet", accuracy: 82.0, latencyMs: 110, paramsM: 12.2 },
  { id: "densenet121",        name: "DenseNet-121",       short: "Dense-121",   family: "DenseNet",     accuracy: 74.4, latencyMs: 70,  paramsM: 8.0  },
  { id: "convnext_tiny",      name: "ConvNeXt-Tiny",      short: "ConvNeXt-T",  family: "ConvNeXt",     accuracy: 82.5, latencyMs: 100, paramsM: 28.6 },
  { id: "shufflenet_v2",      name: "ShuffleNet V2",      short: "Shuffle-V2",  family: "ShuffleNet",   accuracy: 69.4, latencyMs: 20,  paramsM: 2.3  },
];

export const FAMILY_COLORS: Record<ModelFamily, string> = {
  ResNet:       "#3b82f6",
  MobileNet:    "#10b981",
  EfficientNet: "#8b5cf6",
  DenseNet:     "#ec4899",
  ConvNeXt:     "#f97316",
  ShuffleNet:   "#14b8a6",
};

export const FAMILIES: ModelFamily[] = [
  "ResNet",
  "MobileNet",
  "EfficientNet",
  "DenseNet",
  "ConvNeXt",
  "ShuffleNet",
];

export const getFastest       = () => [...MODELS].sort((a, b) => a.latencyMs - b.latencyMs)[0];
export const getMostAccurate  = () => [...MODELS].sort((a, b) => b.accuracy - a.accuracy)[0];
export const getBestBalanced  = () => [...MODELS].sort((a, b) =>
  (b.accuracy / Math.sqrt(b.latencyMs)) - (a.accuracy / Math.sqrt(a.latencyMs))
)[0];
export const getMostEfficient = () => [...MODELS].sort((a, b) => (b.accuracy / b.paramsM) - (a.accuracy / a.paramsM))[0];
