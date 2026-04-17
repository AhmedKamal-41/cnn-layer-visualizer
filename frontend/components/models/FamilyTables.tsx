import { FAMILIES, FAMILY_COLORS, MODELS } from "@/lib/models-data";

export default function FamilyTables() {
  return (
    <div className="space-y-8">
      {FAMILIES.map((family) => {
        const rows = MODELS
          .filter((m) => m.family === family)
          .sort((a, b) => b.accuracy - a.accuracy);

        return (
          <div
            key={family}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: FAMILY_COLORS[family] }}
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {family}
              </h3>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                ({rows.length} {rows.length === 1 ? "model" : "models"})
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <th className="px-5 py-2.5 text-left font-medium">Model</th>
                    <th className="px-5 py-2.5 text-right font-medium">Top-1 acc</th>
                    <th className="px-5 py-2.5 text-right font-medium">CPU latency</th>
                    <th className="px-5 py-2.5 text-right font-medium">Params (M)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-zinc-100 last:border-b-0 transition-colors hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
                    >
                      <td className="px-5 py-2.5 font-medium text-zinc-800 dark:text-zinc-200">
                        {m.name}
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                        {m.accuracy.toFixed(1)}%
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                        {m.latencyMs} ms
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                        {m.paramsM.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
