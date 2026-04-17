import Link from "next/link";

export default function ModelsDashboardPromo() {
  return (
    <section className="border-y border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-zinc-50 py-16 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-5">

          {/* Left: Copy */}
          <div className="lg:col-span-3">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              New
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Not sure which model to use?
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Compare all 11 architectures on one chart. See the accuracy, speed, and size
              tradeoffs side by side — and pick the right model for your task in seconds.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> ResNet</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> MobileNet</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-500" /> EfficientNet</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-pink-500" /> DenseNet</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-500" /> ConvNeXt</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-teal-500" /> ShuffleNet</span>
            </div>
            <div className="mt-8">
              <Link
                href="/models"
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Compare all 11 models
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right: Mini visualization preview card */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Best balance</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">⭐ Recommended</span>
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">EfficientNet-B0</div>
              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">77.7% accuracy in just 40ms</div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                <Metric label="Accuracy" value="77.7%" />
                <Metric label="Latency" value="~40ms" />
                <Metric label="Params" value="5.3M" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</div>
      <div className="text-base font-semibold text-zinc-800 dark:text-zinc-200">{value}</div>
    </div>
  );
}
