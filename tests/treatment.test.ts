import { exploreTreatment } from "@/lib/treatment/explorer";
import { describe, expect, it } from "vitest";

describe("treatment explorer", () => {
  it("returns supported responses for curated conditions", () => {
    const result = exploreTreatment("Type 1 Diabetes", "76092");
    expect(result.supported).toBe(true);
    expect(result.condition).toBe("Type 1 Diabetes Mellitus");
    expect(result.cptCodes.length).toBe(6);
    expect(result.treatmentSettings.length).toBeGreaterThan(0);
    expect(result.recommendation?.optimalSetting).toContain("Arlington");
  });

  it("returns unsupported responses for out-of-scope conditions", () => {
    const result = exploreTreatment("Rare zebra syndrome");
    expect(result.supported).toBe(false);
    expect(result.suggestedConditions?.length).toBeGreaterThan(0);
  });

  it("adds local market context for zipcode-based exploration", () => {
    const result = exploreTreatment("Type 1 Diabetes", "76092");
    expect(result.localContext?.locationLabel).toContain("Arlington");
    expect(result.localContext?.insurancePlans[1]).toBe("Blue Cross Blue Shield of Texas PPO");
    expect(result.summary).toContain("Cost estimates adjusted for Arlington, Texas");
  });

  it("recognizes nearby metro zip codes and zip+4 formatting", () => {
    const metroResult = exploreTreatment("Type 1 Diabetes", "75201");
    const zipPlusFourResult = exploreTreatment("Type 1 Diabetes", "76092-1234");
    expect(metroResult.localContext?.locationLabel).toContain("Dallas-Fort Worth");
    expect(zipPlusFourResult.localContext?.locationLabel).toContain("Arlington");
  });

  it("maps unseeded national zip codes into coherent metro or state markets", () => {
    const seattleResult = exploreTreatment("Type 1 Diabetes", "98101");
    const sanDiegoResult = exploreTreatment("Type 1 Diabetes", "92101");
    expect(seattleResult.localContext?.locationLabel).toContain("Seattle");
    expect(seattleResult.localContext?.insurancePlans[1]).toContain("Premera");
    expect(sanDiegoResult.localContext?.locationLabel).toContain("San Diego");
    expect(sanDiegoResult.localContext?.insurancePlans[1]).toContain("Blue Shield of California");
  });

  it("rejects invalid settings and keeps recommendations deterministic", () => {
    const result = exploreTreatment("ACL MRI Pathway");
    expect(result.treatmentSettings.some((setting) => setting.setting === "Telehealth")).toBe(false);
    expect(result.recommendation?.optimalSetting).toBe("Specialist");
  });

  it("computes savings versus worst case consistently", () => {
    const result = exploreTreatment("Type 1 Diabetes", "76092");
    expect(result.recommendation?.savingsVsWorstCase).toBeGreaterThan(0);
    expect(result.treatmentSettings[0]?.plans).toHaveLength(6);
  });
});
