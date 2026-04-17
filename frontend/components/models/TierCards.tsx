import {
  FAMILY_COLORS,
  getBestBalanced,
  getFastest,
  getMostAccurate,
  getMostEfficient,
  ModelInfo,
} from "@/lib/models-data";

type Tier = {
  icon: string;
  label: string;
  description: string;
  model: ModelInfo;
};

const TIERS: Tier[] = [
  {
    icon: "⚡",
    label: "Fastest",
    description: "Lowest CPU latency — ideal for real-time demos and mobile.",
    model: getFastest(),
  },
  {
    icon: "⚖",
    label: "Best balanced",
    description: "Strongest accuracy-per-millisecond tradeoff.",
    model: getBestBalanced(),
  },
  {
    icon: "🔬",
    label: "Most accurate",
    description: "Highest ImageNet top-1 accuracy in the registry.",
    model: getMostAccurate(),
  },
  {
    icon: "📦",
    label: "Most efficient",
    description: "Highest accuracy per million parameters.",
    model: getMostEfficient(),
  },
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
        {value}
      </div>
    </div>
  );
}

export default function TierCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {TIERS.map((tier) => (
        <div
          key={tier.label}
          className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-base">
              {tier.icon}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {tier.label}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: FAMILY_COLORS[tier.model.family] }}
              aria-hidden="true"
            />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {tier.model.name}
            </h3>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {tier.description}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <Stat label="Accuracy" value={`${tier.model.accuracy.toFixed(1)}%`} />
            <Stat label="Speed" value={`${tier.model.latencyMs}ms`} />
            <Stat label="Size" value={`${tier.model.paramsM.toFixed(1)}M`} />
          </div>
        </div>
      ))}
    </div>
  );
}
