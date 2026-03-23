import { describe, expect, it } from "vitest";
import type { DiagnosticConfig } from "@/types/diagnostic";
import { computeDiagnosticResult } from "./scoring";

const testConfig: DiagnosticConfig = {
  scaleMin: 1,
  scaleMax: 5,
  contextFields: [{ id: "organisationName", label: "Org", required: true }],
  themes: [
    { id: "a", label: "Theme A", themeWeight: 1 },
    { id: "b", label: "Theme B", themeWeight: 2 },
  ],
  questions: [
    { id: "q1", themeId: "a", weight: 2, text: "Q1" },
    { id: "q2", themeId: "a", weight: 1, text: "Q2" },
    { id: "q3", themeId: "b", weight: 1, text: "Q3" },
  ],
  signalTemplates: {
    low_a: { title: "A low", description: "desc a" },
    low_total: { title: "Total low", description: "desc t" },
  },
  signalRules: [
    {
      id: "r1",
      templateId: "low_a",
      priority: 10,
      when: { type: "theme_mean_below", themeId: "a", threshold: 3 },
    },
    {
      id: "r2",
      templateId: "low_total",
      priority: 5,
      when: { type: "total_fraction_below", fraction: 0.5 },
    },
  ],
  riskSignalsHeading: "Risk signals",
  clearPostureHeading: "Posture",
  noRiskSignalsTemplate: {
    title: "Clear",
    description: "No rules matched.",
  },
};

describe("computeDiagnosticResult", () => {
  it("computes weighted theme means", () => {
    const res = computeDiagnosticResult(
      { organisationName: "Test Co", answers: { q1: 4, q2: 2, q3: 5 } },
      testConfig,
    );
    const themeA = res.themeScores.find((t) => t.themeId === "a");
    expect(themeA).toBeDefined();
    // (4*2 + 2*1) / 3 = 10/3
    expect(themeA!.weightedMean).toBeCloseTo(10 / 3, 5);
    const themeB = res.themeScores.find((t) => t.themeId === "b");
    expect(themeB!.weightedMean).toBe(5);
  });

  it("computes total and max total with theme weights", () => {
    const res = computeDiagnosticResult(
      { organisationName: "Test Co", answers: { q1: 5, q2: 5, q3: 5 } },
      testConfig,
    );
    // max: q1 5*2*1 + q2 5*1*1 + q3 5*1*2 = 10+5+10 = 25
    expect(res.maxTotalScore).toBe(25);
    expect(res.totalScore).toBe(25);
  });

  it("selects up to two signals by priority with distinct templates", () => {
    const res = computeDiagnosticResult(
      { organisationName: "Test Co", answers: { q1: 1, q2: 1, q3: 1 } },
      testConfig,
    );
    expect(res.signals.length).toBeGreaterThanOrEqual(1);
    expect(res.signals[0].title).toBe("A low");
  });

  it("throws on missing answers", () => {
    expect(() =>
      computeDiagnosticResult(
        { organisationName: "X", answers: { q1: 3 } },
        testConfig,
      ),
    ).toThrow(/Missing answer/);
  });
});
