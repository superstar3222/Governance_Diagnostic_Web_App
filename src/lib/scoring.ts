import type {
  DiagnosticConfig,
  DiagnosticResult,
  QuestionId,
  ThemeScore,
} from "@/types/diagnostic";

export interface ScoringInput {
  organisationName: string;
  answers: Record<QuestionId, number>;
}

function assertAnswersComplete(
  config: DiagnosticConfig,
  answers: Record<QuestionId, number>,
): void {
  for (const q of config.questions) {
    const v = answers[q.id];
    if (typeof v !== "number" || Number.isNaN(v)) {
      throw new Error(`Missing answer for question "${q.id}"`);
    }
    if (v < config.scaleMin || v > config.scaleMax) {
      throw new Error(`Answer for "${q.id}" out of range`);
    }
  }
}

function computeThemeScores(
  config: DiagnosticConfig,
  answers: Record<QuestionId, number>,
): ThemeScore[] {
  const themeMeta = new Map(config.themes.map((t) => [t.id, t]));

  const aggregates = new Map<
    string,
    { label: string; tw: number; weightedSum: number; weightSum: number }
  >();

  for (const q of config.questions) {
    const theme = themeMeta.get(q.themeId);
    if (!theme) {
      throw new Error(`Unknown theme "${q.themeId}" on question "${q.id}"`);
    }
    const answer = answers[q.id];
    const effectiveWeight = q.weight * theme.themeWeight;
    const prev = aggregates.get(q.themeId) ?? {
      label: theme.label,
      tw: theme.themeWeight,
      weightedSum: 0,
      weightSum: 0,
    };
    prev.weightedSum += answer * effectiveWeight;
    prev.weightSum += effectiveWeight;
    aggregates.set(q.themeId, prev);
  }

  return config.themes.map((t) => {
    const agg = aggregates.get(t.id);
    if (!agg || agg.weightSum <= 0) {
      throw new Error(`No questions mapped to theme "${t.id}"`);
    }
    return {
      themeId: t.id,
      label: agg.label,
      weightedSum: agg.weightedSum,
      weightSum: agg.weightSum,
      weightedMean: agg.weightedSum / agg.weightSum,
    };
  });
}

function computeTotalScore(
  config: DiagnosticConfig,
  answers: Record<QuestionId, number>,
): { totalScore: number; maxTotalScore: number } {
  const themeMeta = new Map(config.themes.map((t) => [t.id, t]));
  let total = 0;
  let maxTotal = 0;
  for (const q of config.questions) {
    const theme = themeMeta.get(q.themeId);
    if (!theme) throw new Error(`Unknown theme "${q.themeId}"`);
    const w = q.weight * theme.themeWeight;
    total += answers[q.id] * w;
    maxTotal += config.scaleMax * w;
  }
  return { totalScore: total, maxTotalScore: maxTotal };
}

function ruleMatches(
  when: DiagnosticConfig["signalRules"][number]["when"],
  themeScores: ThemeScore[],
  totalScore: number,
  maxTotalScore: number,
): boolean {
  if (when.type === "theme_mean_below") {
    const ts = themeScores.find((t) => t.themeId === when.themeId);
    if (!ts) return false;
    return ts.weightedMean < when.threshold;
  }
  if (when.type === "total_fraction_below") {
    if (maxTotalScore <= 0) return false;
    return totalScore / maxTotalScore < when.fraction;
  }
  return false;
}

const MAX_SIGNALS = 2;

/**
 * Pure scoring + signal selection. Pass any `DiagnosticConfig` (e.g. fixtures in tests).
 */
export function computeDiagnosticResult(
  input: ScoringInput,
  config: DiagnosticConfig,
): DiagnosticResult {
  assertAnswersComplete(config, input.answers);
  const themeScores = computeThemeScores(config, input.answers);
  const { totalScore, maxTotalScore } = computeTotalScore(config, input.answers);

  const matched = config.signalRules
    .filter((r) => ruleMatches(r.when, themeScores, totalScore, maxTotalScore))
    .sort((a, b) => b.priority - a.priority);

  const seen = new Set<string>();
  const signals: DiagnosticResult["signals"] = [];
  for (const r of matched) {
    const tmpl = config.signalTemplates[r.templateId];
    if (!tmpl) {
      throw new Error(`Unknown signal template "${r.templateId}"`);
    }
    if (seen.has(r.templateId)) continue;
    seen.add(r.templateId);
    signals.push({
      id: r.id,
      title: tmpl.title,
      description: tmpl.description,
    });
    if (signals.length >= MAX_SIGNALS) break;
  }

  return {
    organisationName: input.organisationName,
    themeScores,
    totalScore,
    maxTotalScore,
    signals,
  };
}
