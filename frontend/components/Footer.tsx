import Link from "next/link";

const PRODUCT_LINKS = [
  { label: "Try Demo", href: "/#get-started" },
  { label: "Compare Models", href: "/models" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
];

const RESOURCES_LINKS = [
  { label: "GitHub", href: "https://github.com/AhmedKamal-41/cnn-layer-visualizer", external: true },
  { label: "Documentation", href: "https://github.com/AhmedKamal-41/cnn-layer-visualizer#readme", external: true },
  { label: "Report an issue", href: "https://github.com/AhmedKamal-41/cnn-layer-visualizer/issues", external: true },
  { label: "Contributing", href: "https://github.com/AhmedKamal-41/cnn-layer-visualizer/blob/main/CONTRIBUTING.md", external: true },
];

const PAPERS = [
  { label: "Grad-CAM (Selvaraju et al. 2017)", href: "https://arxiv.org/abs/1610.02391" },
  { label: "Grad-CAM++ (Chattopadhyay et al. 2018)", href: "https://arxiv.org/abs/1710.11063" },
  { label: "Guided Backprop (Springenberg et al. 2015)", href: "https://arxiv.org/abs/1412.6806" },
];

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "License (MIT)", href: "https://github.com/AhmedKamal-41/cnn-layer-visualizer/blob/main/LICENSE", external: true },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">

        {/* Top grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">

          {/* Logo + tagline (spans 2 cols on lg) */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">convLens</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-zinc-600 dark:text-zinc-400">
              An open-source XAI platform for visualizing how CNNs see and interpret images.
              Built for learning, research, and model debugging.
            </p>

            {/* Tech stack chips */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              <TechChip>Next.js</TechChip>
              <TechChip>FastAPI</TechChip>
              <TechChip>PyTorch</TechChip>
              <TechChip>TypeScript</TechChip>
              <TechChip>Tailwind</TechChip>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Product</h3>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Resources</h3>
            <ul className="mt-4 space-y-2.5">
              {RESOURCES_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href} external={link.external}>
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Research papers */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Research</h3>
            <ul className="mt-4 space-y-2.5">
              {PAPERS.map((paper) => (
                <li key={paper.label}>
                  <a
                    href={paper.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    {paper.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">

            {/* Left: copyright + legal */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>© {new Date().getFullYear()} convLens</span>
              <span className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
              {LEGAL_LINKS.map((link, i) => (
                <span key={link.label} className="flex items-center gap-x-4">
                  <FooterLink href={link.href} external={link.external} className="text-xs">
                    {link.label}
                  </FooterLink>
                  {i < LEGAL_LINKS.length - 1 && <span className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />}
                </span>
              ))}
            </div>

            {/* Right: GitHub link */}
            <a
              href="https://github.com/AhmedKamal-41/cnn-layer-visualizer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              aria-label="View source on GitHub"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.07.78 2.16 0 1.56-.01 2.81-.01 3.19 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5z"/>
              </svg>
              <span>Star on GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function TechChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      {children}
    </span>
  );
}

function FooterLink({
  href,
  external,
  children,
  className = "",
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const baseClass = `text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={baseClass}>
        {children}
      </a>
    );
  }
  return <Link href={href} className={baseClass}>{children}</Link>;
}
