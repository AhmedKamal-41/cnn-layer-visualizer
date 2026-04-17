import FamilyTables from "@/components/models/FamilyTables";
import ModelScatterChart from "@/components/models/ModelScatterChart";
import TierCards from "@/components/models/TierCards";

export const metadata = {
  title: "Model Comparison · ConvLens",
  description:
    "Compare accuracy, speed, and size across 11 pretrained CNN models.",
};

export default function ModelsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            11 models · 6 architecture families
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Model comparison
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Every architecture available in ConvLens, plotted by accuracy, speed, and
            parameter count. Use this page to pick the right model for your task —
            then open the viewer to see what it learned.
          </p>
        </header>

        <section className="mb-16">
          <h2 className="mb-5 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Best in each tier
          </h2>
          <TierCards />
        </section>

        <section className="mb-16">
          <h2 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Accuracy vs speed
          </h2>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Bubble size represents parameter count. Models toward the upper-left offer
            the best tradeoff.
          </p>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 sm:p-6">
            <ModelScatterChart />
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Full registry, grouped by family
          </h2>
          <FamilyTables />
        </section>

        <section>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Methodology
            </h3>
            <p>
              Top-1 ImageNet accuracy figures are reproduced from the{" "}
              <a
                href="https://pytorch.org/vision/stable/models.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                torchvision model zoo
              </a>{" "}
              using the default pretrained weights. CPU inference latency is an
              approximate measurement taken on the ConvLens backend container
              (single-thread, 224×224 input, warm cache) and will vary with hardware.
              Parameter counts are reported by torchvision and rounded to one decimal.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
