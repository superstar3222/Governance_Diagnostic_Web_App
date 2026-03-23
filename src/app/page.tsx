import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center gap-10">
      <div className="space-y-4 border-b border-[var(--border)] pb-10">
        <p className="text-sm tracking-wide text-[var(--muted)] uppercase">
          Board governance
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Governance diagnostic
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-[var(--muted)]">
          A short, logic-driven check-in on decision dynamics, psychological
          safety, and governance records. You will receive a score and focused
          risk signals based on your responses.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href="/diagnostic"
          prefetch={false}
          className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-contrast)] transition hover:opacity-90"
        >
          Start diagnostic
        </Link>
        <p className="text-sm text-[var(--muted)]">
          Approximately 3 questions · No account required
        </p>
      </div>
    </main>
  );
}
