"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { diagnosticConfig } from "@/data/diagnosticConfig";
import { computeDiagnosticResult } from "@/lib/scoring";
import type { DiagnosticResult, QuestionId } from "@/types/diagnostic";

type Step = "context" | QuestionId | "results";

const QUESTION_IDS = diagnosticConfig.questions.map((q) => q.id) as QuestionId[];

function stepIndex(step: Step): number {
  if (step === "context") return 0;
  if (step === "results") return QUESTION_IDS.length + 1;
  return 1 + QUESTION_IDS.indexOf(step);
}

const TOTAL_STEPS = 1 + QUESTION_IDS.length;

export function DiagnosticWizard() {
  const [step, setStep] = useState<Step>("context");
  const [organisationName, setOrganisationName] = useState("");
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, number>>>(
    {},
  );
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const progressLabel = useMemo(() => {
    const i = stepIndex(step);
    if (step === "results") return "Complete";
    return `Step ${i} of ${TOTAL_STEPS}`;
  }, [step]);

  const orgField = diagnosticConfig.contextFields[0];

  function reset() {
    setStep("context");
    setOrganisationName("");
    setAnswers({});
    setResult(null);
  }

  function goNextFromContext() {
    if (!organisationName.trim()) return;
    setStep(QUESTION_IDS[0]);
  }

  function setAnswer(id: QuestionId, value: number) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleQuestionNext(current: QuestionId) {
    const v = answers[current];
    if (typeof v !== "number") return;
    const idx = QUESTION_IDS.indexOf(current);
    const nextId = QUESTION_IDS[idx + 1];
    const complete = { ...answers, [current]: v } as Record<QuestionId, number>;
    if (nextId) {
      setAnswers(complete);
      setStep(nextId);
    } else {
      const finalResult = computeDiagnosticResult(
        { organisationName: organisationName.trim(), answers: complete },
        diagnosticConfig,
      );
      setResult(finalResult);
      setStep("results");
    }
  }

  if (step === "context") {
    return (
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-sm text-[var(--muted)]">{progressLabel}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Organisation context
          </h1>
          <p className="text-[var(--muted)]">
            We use this to tailor the report header. No data is stored on a
            server in this preview.
          </p>
        </header>
        <div className="space-y-2">
          <label htmlFor={orgField.id} className="block text-sm font-medium">
            {orgField.label}
          </label>
          <input
            id={orgField.id}
            type="text"
            autoComplete="organization"
            placeholder={orgField.placeholder}
            value={organisationName}
            onChange={(e) => setOrganisationName(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2.5 text-[var(--foreground)] outline-none ring-[var(--accent)] focus:ring-2"
          />
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            prefetch={false}
            className="rounded-md border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-white/60"
          >
            Back
          </Link>
          <button
            type="button"
            onClick={goNextFromContext}
            disabled={!organisationName.trim()}
            className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-contrast)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (step === "results" && result) {
    const pct =
      result.maxTotalScore > 0
        ? Math.round((result.totalScore / result.maxTotalScore) * 100)
        : 0;
    return (
      <div className="space-y-10">
        <header className="space-y-2 border-b border-[var(--border)] pb-8">
          <p className="text-sm text-[var(--muted)]">{progressLabel}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Governance snapshot
          </h1>
          <p className="text-[var(--muted)]">
            <span className="font-medium text-[var(--foreground)]">
              {result.organisationName}
            </span>
            — based on this short diagnostic sample.
          </p>
        </header>

        <section className="space-y-3 rounded-lg border border-[var(--border)] bg-white/70 p-6">
          <h2 className="text-sm font-medium tracking-wide text-[var(--muted)] uppercase">
            Score
          </h2>
          <p className="text-3xl font-semibold tabular-nums">
            {result.totalScore.toFixed(1)}
            <span className="text-lg font-normal text-[var(--muted)]">
              {" "}
              / {result.maxTotalScore.toFixed(1)}
            </span>
          </p>
          <p className="text-sm text-[var(--muted)]">
            Weighted across themes ({pct}% of maximum for this question set).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium tracking-wide text-[var(--muted)] uppercase">
            {result.signals.length === 0
              ? diagnosticConfig.clearPostureHeading
              : diagnosticConfig.riskSignalsHeading}
          </h2>
          {result.signals.length === 0 ? (
            <div className="rounded-lg border border-[var(--border)] bg-white/70 p-5">
              <h3 className="font-medium text-[var(--foreground)]">
                {diagnosticConfig.noRiskSignalsTemplate.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {diagnosticConfig.noRiskSignalsTemplate.description}
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {result.signals.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-[var(--border)] bg-white/70 p-5"
                >
                  <h3 className="font-medium text-[var(--foreground)]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {s.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2 text-sm text-[var(--muted)]">
          <p className="font-medium text-[var(--foreground)]">Theme breakdown</p>
          <ul className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)] bg-white/50">
            {result.themeScores.map((t) => (
              <li
                key={t.themeId}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span>{t.label}</span>
                <span className="tabular-nums text-[var(--foreground)]">
                  {t.weightedMean.toFixed(2)} / {diagnosticConfig.scaleMax}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={reset}
            className="text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
          >
            Run again
          </button>
          <Link
            href="/"
            prefetch={false}
            className="text-sm font-medium text-[var(--muted)] underline-offset-4 hover:underline"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  const q = diagnosticConfig.questions.find((x) => x.id === step);
  if (!q) return null;

  const currentIdx = QUESTION_IDS.indexOf(q.id as QuestionId);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-[var(--muted)]">{progressLabel}</p>
        <h1 className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
          {q.text}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {diagnosticConfig.scaleMin} = low alignment · {diagnosticConfig.scaleMax}{" "}
          = strong alignment
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {Array.from(
          { length: diagnosticConfig.scaleMax - diagnosticConfig.scaleMin + 1 },
          (_, i) => diagnosticConfig.scaleMin + i,
        ).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setAnswer(q.id as QuestionId, n)}
            className={`min-h-11 min-w-11 rounded-md border text-sm font-medium tabular-nums transition ${
              answers[q.id as QuestionId] === n
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                : "border-[var(--border)] bg-white/80 hover:border-[var(--muted)]"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-md border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:bg-white/60"
          onClick={() => {
            if (currentIdx <= 0) setStep("context");
            else setStep(QUESTION_IDS[currentIdx - 1]);
          }}
        >
          Back
        </button>
        <button
          type="button"
          disabled={typeof answers[q.id as QuestionId] !== "number"}
          onClick={() => handleQuestionNext(q.id as QuestionId)}
          className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-contrast)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {currentIdx >= QUESTION_IDS.length - 1 ? "See results" : "Next"}
        </button>
      </div>
    </div>
  );
}
