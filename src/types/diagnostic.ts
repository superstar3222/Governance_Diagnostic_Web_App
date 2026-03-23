export type ThemeId = string;
export type QuestionId = string;

export interface Theme {
  id: ThemeId;
  label: string;
  /** Applied when rolling question scores into theme aggregates and totals. */
  themeWeight: number;
}

export interface Question {
  id: QuestionId;
  themeId: ThemeId;
  weight: number;
  text: string;
}

export interface SignalTemplate {
  title: string;
  description: string;
}

export type SignalWhen =
  | { type: "theme_mean_below"; themeId: ThemeId; threshold: number }
  | { type: "total_fraction_below"; fraction: number };

/** Declarative rules: conditions are data; evaluation is implemented once in scoring. */
export interface SignalRule {
  id: string;
  templateId: string;
  priority: number;
  when: SignalWhen;
}

export interface ContextField {
  id: string;
  label: string;
  placeholder?: string;
  required: boolean;
}

export interface DiagnosticConfig {
  scaleMin: number;
  scaleMax: number;
  contextFields: ContextField[];
  themes: Theme[];
  questions: Question[];
  signalTemplates: Record<string, SignalTemplate>;
  signalRules: SignalRule[];
  /** Section heading when at least one risk rule matched. */
  riskSignalsHeading: string;
  /** Section heading when no risk rules matched (strong or neutral sample). */
  clearPostureHeading: string;
  /** Copy for the results card when no `signalRules` fire — edit without touching UI code. */
  noRiskSignalsTemplate: SignalTemplate;
}

export interface ThemeScore {
  themeId: ThemeId;
  label: string;
  weightedSum: number;
  weightSum: number;
  /** 1–scaleMax, weighted by question weights within the theme */
  weightedMean: number;
}

export interface DiagnosticResult {
  organisationName: string;
  themeScores: ThemeScore[];
  totalScore: number;
  maxTotalScore: number;
  signals: { id: string; title: string; description: string }[];
}
