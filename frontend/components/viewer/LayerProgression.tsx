"use client";

import { useEffect, useState } from "react";

type LayerOverlay = {
  name: string;
  overlayUrl: string;
  description?: string;
};

type Props = {
  prediction: string;
  confidence: number;
  layers: LayerOverlay[];
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  conv1:  "Edges, color blobs, simple textures",
  layer1: "Curves, corners, basic patterns",
  layer2: "Textures, repeating motifs",
  layer3: "Object parts, body components",
  layer4: "Complete objects, decision regions",
};

export default function LayerProgression({ prediction, confidence, layers }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(Math.max(0, layers.length - 1));

  useEffect(() => {
    setSelectedIdx(Math.max(0, layers.length - 1));
  }, [layers.length]);

  if (!layers || layers.length === 0) {
    return null;
  }

  const selected = layers[Math.min(selectedIdx, layers.length - 1)];
  const confidencePct = (confidence * 100).toFixed(1);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      {/* HEADER — title + prediction badge */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 sm:text-xl">
            Why the model thinks this is a{" "}
            <span className="text-zinc-900 dark:text-zinc-50">{prediction}</span>
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
            All Grad-CAM stages at once — select one for details below.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{confidencePct}%</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">confidence</span>
          </div>
          <div className="mt-1.5 h-1 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Compact grid — all layer heatmaps visible together */}
      <div className="mb-4">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:text-xs">
          Grad-CAM by layer (click to inspect)
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {layers.map((layer, idx) => {
            const isActive = idx === selectedIdx;
            return (
              <button
                key={layer.name}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className="group overflow-hidden rounded-lg border border-zinc-200 bg-white text-left shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600"
                aria-label={`View ${layer.name} heatmap`}
                aria-pressed={isActive}
              >
                <div className="relative h-44 w-full overflow-hidden bg-zinc-100 sm:h-52 dark:bg-zinc-900">
                  <img
                    src={layer.overlayUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div
                  className={`px-2 py-1.5 text-center text-[11px] font-medium leading-tight transition-colors sm:text-xs ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-50 text-zinc-700 group-hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:group-hover:bg-zinc-800"
                  }`}
                >
                  {layer.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected layer — compact detail + depth bar */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex w-fit items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700 sm:text-xs">
            Layer {selectedIdx + 1} of {layers.length}
          </span>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 sm:text-base">{selected.name}</h3>
        </div>
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-sm">
          {STAGE_DESCRIPTIONS[selected.name] ?? selected.description ?? "Feature representation at this depth"}
        </p>
        <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Position in network</div>
          <div className="mt-1.5 flex items-center gap-1">
            {layers.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= selectedIdx ? "bg-zinc-800 dark:bg-zinc-200" : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>Input</span>
            <span>Decision</span>
          </div>
        </div>
      </div>

      {/* FOOTER NOTE */}
      <div className="mt-4 flex items-center justify-center gap-2 border-t border-zinc-100 pt-4 text-[11px] text-zinc-500 dark:border-zinc-900 dark:text-zinc-400 sm:text-xs">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
        </svg>
        <span>Early layers detect basic features → Late layers focus on decision regions</span>
      </div>
    </section>
  );
}
