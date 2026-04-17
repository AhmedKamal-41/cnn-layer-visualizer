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
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
      {/* HEADER — title + prominent prediction badge */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Why the model thinks this is a{" "}
            <span className="text-zinc-900 dark:text-zinc-50">{prediction}</span>
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Watch how attention sharpens from raw edges to the final decision region.
          </p>
        </div>

        {/* Confidence badge with gradient progress bar */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{confidencePct}%</span>
            <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">confidence</span>
          </div>
          <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
        </div>
      </div>

      {/* HERO: large featured image + side description panel */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Big image — spans 2 cols on desktop */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
            <img
              src={selected.overlayUrl}
              alt={`Grad-CAM heatmap at ${selected.name}`}
              className="aspect-square w-full object-cover transition-opacity duration-300"
              key={selected.name}
            />
          </div>
        </div>

        {/* Description panel */}
        <div className="lg:col-span-1">
          <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700">
              Layer {selectedIdx + 1} of {layers.length}
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{selected.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {STAGE_DESCRIPTIONS[selected.name] ?? selected.description ?? "Feature representation at this depth"}
            </p>

            {/* Position-in-network indicator */}
            <div className="mt-auto pt-6">
              <div className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Position in network</div>
              <div className="mt-1.5 flex items-center gap-1.5">
                {layers.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= selectedIdx
                        ? "bg-zinc-800 dark:bg-zinc-200"
                        : "bg-zinc-200 dark:bg-zinc-800"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>Input</span>
                <span>Decision</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THUMBNAIL STRIP — clickable */}
      <div>
        <div className="mb-3 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Click a layer to focus
        </div>
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${layers.length}, minmax(0, 1fr))` }}
        >
          {layers.map((layer, idx) => {
            const isActive = idx === selectedIdx;
            return (
              <button
                key={layer.name}
                onClick={() => setSelectedIdx(idx)}
                className={`group overflow-hidden rounded-lg border-2 transition-all ${
                  isActive
                    ? "border-zinc-900 dark:border-zinc-100"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                aria-label={`View ${layer.name} heatmap`}
                aria-pressed={isActive}
              >
                <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-900">
                  <img src={layer.overlayUrl} alt="" className="h-full w-full object-cover" />
                  {isActive && <div className="absolute inset-0 ring-2 ring-inset ring-white/30" />}
                </div>
                <div
                  className={`px-2 py-1.5 text-center text-xs font-medium transition-colors ${
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

      {/* FOOTER NOTE */}
      <div className="mt-6 flex items-center justify-center gap-2 border-t border-zinc-100 pt-6 text-xs text-zinc-500 dark:border-zinc-900 dark:text-zinc-400">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
        </svg>
        <span>Early layers detect basic features → Late layers focus on decision regions</span>
      </div>
    </section>
  );
}
