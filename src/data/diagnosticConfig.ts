import type { DiagnosticConfig } from "@/types/diagnostic";

/**
 * Content layer: questions, labels, weights, and report wording.
 * Update this file to change copy or weights without touching scoring code.
 */
export const diagnosticConfig: DiagnosticConfig = {
  scaleMin: 1,
  scaleMax: 5,
  contextFields: [
    {
      id: "organisationName",
      label: "Organisation name",
      placeholder: "e.g. Acme Holdings Ltd",
      required: true,
    },
  ],
  themes: [
    {
      id: "decision_dynamics",
      label: "Decision dynamics & psychological safety",
      themeWeight: 1,
    },
    {
      id: "governance_records",
      label: "Governance records & board discipline",
      themeWeight: 1.2,
    },
  ],
  questions: [
    {
      id: "q1",
      themeId: "decision_dynamics",
      weight: 2,
      text: "In practice, can directors challenge management openly without fear of reprisal or marginalisation?",
    },
    {
      id: "q2",
      themeId: "decision_dynamics",
      weight: 1,
      text: "Are dissenting views in the boardroom actively sought, documented, and reflected in decisions?",
    },
    {
      id: "q3",
      themeId: "governance_records",
      weight: 1.5,
      text: "Do board minutes accurately capture material decisions, rationale, and dissent (not only unanimous outcomes)?",
    },
  ],
  signalTemplates: {
    psychological_safety_gap: {
      title: "Psychological safety may be weaker than the board assumes",
      description:
        "Where challenge is costly or undocumented, decisions can look unanimous while risks stay hidden. That pattern often surfaces late—under stress, regulatory scrutiny, or litigation.",
    },
    records_integrity_risk: {
      title: "Governance records may not withstand scrutiny",
      description:
        "Thin or sanitised minutes reduce the board’s ability to demonstrate diligence and can increase exposure when outcomes are disputed or investigated.",
    },
    overall_pressure: {
      title: "Overall governance posture looks stretched",
      description:
        "Scores across this short sample suggest multiple friction points. A fuller diagnostic would prioritise where consequences are highest for your sector and risk profile.",
    },
  },
  signalRules: [
    {
      id: "rule_decision_dynamics_low",
      templateId: "psychological_safety_gap",
      priority: 10,
      when: { type: "theme_mean_below", themeId: "decision_dynamics", threshold: 3 },
    },
    {
      id: "rule_records_low",
      templateId: "records_integrity_risk",
      priority: 9,
      when: { type: "theme_mean_below", themeId: "governance_records", threshold: 3 },
    },
    {
      id: "rule_total_low",
      templateId: "overall_pressure",
      priority: 5,
      when: { type: "total_fraction_below", fraction: 0.55 },
    },
  ],
  riskSignalsHeading: "Risk signals",
  clearPostureHeading: "Posture on this sample",
  noRiskSignalsTemplate: {
    title: "No elevated risk flags on this short sample",
    description:
      "Your answers did not cross the thresholds we use for decision-dynamics strain, records discipline, or overall pressure. That is encouraging, but it is still a narrow slice—stress, turnover, or a crisis can surface gaps that day-to-day comfort misses. A fuller diagnostic would stress-test blind spots and sector-specific consequences.",
  },
};
