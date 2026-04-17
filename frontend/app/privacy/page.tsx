export const metadata = {
  title: "Privacy Policy · ConvLens",
  description: "How ConvLens handles your data — short and honest.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-20">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="max-w-none space-y-8">
        <Section title="The short version">
          <p>
            ConvLens is an open-source educational tool. We don&apos;t track you, we don&apos;t show
            ads, and we don&apos;t sell anything. Images you upload are processed in memory to
            generate visualizations and are not retained beyond the duration of your session.
          </p>
        </Section>

        <Section title="What we process">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Uploaded images.</strong> Images you upload for analysis are sent to
              our backend, processed by a PyTorch model, and used to generate Grad-CAM and
              feature map visualizations. They are stored temporarily on the server&apos;s
              filesystem during processing and deleted when the server restarts (typically
              within hours).
            </li>
            <li>
              <strong>Generated visualizations.</strong> Output images (heatmaps, overlays,
              feature maps) are stored alongside your job temporarily and served back to
              your browser. These are also ephemeral.
            </li>
            <li>
              <strong>No personal information.</strong> ConvLens does not require accounts,
              does not collect names, emails, or any identifying information.
            </li>
          </ul>
        </Section>

        <Section title="What we don't do">
          <ul className="list-disc space-y-2 pl-5">
            <li>No tracking cookies, no analytics scripts, no ad networks.</li>
            <li>No selling, sharing, or licensing of any data to third parties.</li>
            <li>No long-term storage of uploaded content.</li>
            <li>No model training on user-uploaded images.</li>
          </ul>
        </Section>

        <Section title="Logs and operational data">
          <p>
            Our hosting provider (Railway) maintains standard server logs containing IP
            addresses and request paths for security and debugging purposes. These are
            retained per Railway&apos;s own policy and are not accessible to ConvLens beyond
            standard log inspection during incident response.
          </p>
        </Section>

        <Section title="Open source">
          <p>
            ConvLens is open source under the MIT license. You can review exactly how your
            data is handled by reading the source code at{" "}
            <a href="https://github.com/AhmedKamal-41/cnn-layer-visualizer" className="underline">
              github.com/AhmedKamal-41/cnn-layer-visualizer
            </a>
            . If you prefer full control, you can self-host the entire stack with one
            <code className="mx-1 rounded bg-zinc-100 px-1 py-0.5 text-sm dark:bg-zinc-800">docker compose up</code>
            command.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For privacy questions, open an issue at{" "}
            <a href="https://github.com/AhmedKamal-41/cnn-layer-visualizer/issues" className="underline">
              github.com/AhmedKamal-41/cnn-layer-visualizer/issues
            </a>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <div className="mt-3 leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
    </section>
  );
}
