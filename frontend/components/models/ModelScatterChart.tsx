"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import {
  FAMILIES,
  FAMILY_COLORS,
  MODELS,
  ModelInfo,
} from "@/lib/models-data";

type TooltipPayloadEntry = {
  payload?: ModelInfo;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }
  const model = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      <div className="font-semibold text-zinc-900 dark:text-zinc-50">
        {model.name}
      </div>
      <div className="mt-1 space-y-0.5 text-zinc-600 dark:text-zinc-400">
        <div>Top-1 accuracy: {model.accuracy.toFixed(1)}%</div>
        <div>CPU latency: {model.latencyMs} ms</div>
        <div>Params: {model.paramsM.toFixed(1)} M</div>
      </div>
    </div>
  );
}

export default function ModelScatterChart() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const height = isMobile ? 360 : 480;

  const byFamily = FAMILIES.map((family) => ({
    family,
    data: MODELS.filter((m) => m.family === family),
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 24, right: 48, bottom: 48, left: 32 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-zinc-200 dark:stroke-zinc-800"
          />
          <XAxis
            type="number"
            dataKey="latencyMs"
            name="CPU latency"
            domain={[0, 140]}
            tick={{ fontSize: 12, fill: "currentColor" }}
            label={{
              value: "CPU inference time (ms)",
              position: "insideBottom",
              offset: -24,
              style: { fontSize: 12, fill: "currentColor" },
            }}
            stroke="currentColor"
          />
          <YAxis
            type="number"
            dataKey="accuracy"
            name="Top-1 accuracy"
            domain={[64, 86]}
            tick={{ fontSize: 12, fill: "currentColor" }}
            label={{
              value: "Top-1 ImageNet accuracy (%)",
              angle: -90,
              position: "insideLeft",
              offset: 0,
              style: { textAnchor: "middle", fontSize: 12, fill: "currentColor" },
            }}
            stroke="currentColor"
          />
          <ZAxis
            type="number"
            dataKey="paramsM"
            range={[60, 600]}
            name="Params"
          />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<CustomTooltip />} />
          {byFamily.map(({ family, data }) => (
            <Scatter
              key={family}
              name={family}
              data={data}
              fill={FAMILY_COLORS[family]}
              fillOpacity={0.75}
              stroke={FAMILY_COLORS[family]}
            >
              <LabelList
                dataKey="short"
                position="right"
                offset={10}
                style={{ fontSize: 11, fill: "currentColor" }}
              />
            </Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
