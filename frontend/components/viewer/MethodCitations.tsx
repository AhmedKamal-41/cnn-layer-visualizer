const CITATIONS = [
  {
    method: "Grad-CAM",
    authors: "Selvaraju et al.",
    year: "2017",
    title: "Visual Explanations from Deep Networks via Gradient-based Localization",
    arxiv: "https://arxiv.org/abs/1610.02391",
  },
  // Add more here as additional XAI methods are implemented
  // {
  //   method: "Grad-CAM++",
  //   authors: "Chattopadhyay et al.",
  //   year: "2018",
  //   title: "Improved Visual Explanations for Deep CNNs",
  //   arxiv: "https://arxiv.org/abs/1710.11063",
  // },
];

export default function MethodCitations() {
  return (
    <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Methods used
          </h3>
          <ul className="mt-2 space-y-1.5">
            {CITATIONS.map((c) => (
              <li key={c.method} className="text-xs text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{c.method}</span>
                {" — "}
                <a
                  href={c.arxiv}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                >
                  {c.authors} ({c.year}). {c.title}.
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
