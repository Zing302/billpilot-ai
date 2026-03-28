import { conditionDefinitions, supportedConditionNames } from "@/data/conditions";
import { getLocalMarketContext, type LocalMarketContext, type LocalMarketPlan } from "@/data/local-markets";
import { treatmentExplorerResultSchema, type TreatmentExplorerResult } from "@/lib/schemas/billpilot";

const settingDescriptions: Record<string, string> = {
  "primary-care": "Best for routine outpatient monitoring when the episode does not require hospital overhead.",
  "urgent-care": "Useful for acute flares or same-day concerns, but usually the most expensive routine pathway.",
  telehealth: "Convenient for medication review or low-acuity follow-up when a physical exam is not required.",
  specialist: "Higher-value when targeted expertise changes treatment quality or follow-up cadence.",
  "outpatient-imaging": "Appropriate for imaging-heavy workups that do not need an emergency department.",
  "endocrinology-clinic": "Specialist diabetes management with stronger long-term oversight and lower complication risk.",
  "hospital-education": "Hospital-based outpatient education and monitoring with higher facility overhead.",
  "retail-pharmacy": "Medication and supply access setting, best used as part of the overall diabetes care path.",
};

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function titleCase(value: string): string {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function getPlanProfiles(localContext: LocalMarketContext | null): LocalMarketPlan[] {
  return (
    localContext?.plans ?? getLocalMarketContext("00000")?.plans ?? []
  );
}

function resolvePatientCost(settingId: string, base: number, plan: LocalMarketPlan): number {
  const model = settingId === "retail-pharmacy" ? plan.pharmacyCopayModel : plan.medicalCopayModel;
  const flat = model.flatBySetting?.[settingId];
  const computed = flat ?? base * model.patientShare;
  return Number(Math.min(computed, base * plan.oopShareModel.maxPatientShare || computed).toFixed(2));
}

function getSettingLabel(settingId: string, localContext: LocalMarketContext | null): string {
  const matchedFacility = localContext?.facilities.find((facility) => facility.settingId === settingId);
  return matchedFacility?.name ?? titleCase(settingId);
}

function getSettingType(settingId: string, localContext: LocalMarketContext | null): string {
  const matchedFacility = localContext?.facilities.find((facility) => facility.settingId === settingId);
  return matchedFacility?.type ?? titleCase(settingId);
}

function buildMethodology(locationLabel?: string): string[] {
  return [
    "Step 1: BillPilot maps the condition to the relevant CPT billing codes providers typically use.",
    "Step 2: Costs are benchmarked against CMS Medicare rates as the transparent pricing floor.",
    "Step 3: Every setting is priced across six insurance-plan scenarios so out-of-pocket differences are visible.",
    `Step 4: The lowest-cost clinically valid path is highlighted with actionable savings tips${locationLabel ? ` for ${locationLabel}` : ""}.`,
  ];
}

export function exploreTreatment(
  conditionInput: string,
  zipCode?: string,
  localContext: LocalMarketContext | null = null,
): TreatmentExplorerResult {
  const activeLocalContext = localContext ?? getLocalMarketContext(zipCode);
  const normalized = slugify(conditionInput);
  const condition = conditionDefinitions.find(
    (item) => item.slug === normalized || slugify(item.name) === normalized,
  );

  if (!condition) {
    return treatmentExplorerResultSchema.parse({
      condition: conditionInput,
      supported: false,
      summary: "This condition is outside the current benchmarked launch set.",
      cptCodes: [],
      treatmentSettings: [],
      recommendation: null,
      methodology: buildMethodology(activeLocalContext?.locationLabel),
      localContext: activeLocalContext,
      suggestedConditions: supportedConditionNames.slice(0, 6),
    });
  }

  const planProfiles = getPlanProfiles(activeLocalContext);

  const treatmentSettings = condition.validSettings.map((settingId) => {
    const base = Number(condition.pricingAnchors[settingId].toFixed(2));
    const plans = planProfiles.map((plan) => {
      if (settingId === "telehealth" && condition.slug === "acl-mri-pathway") {
        return {
          name: plan.displayName,
          planPays: null,
          patientPays: null,
          note: "Not clinically appropriate for the full workup.",
        };
      }

      const patientPays = resolvePatientCost(settingId, base, plan);

      return {
        name: plan.displayName,
        planPays: Number(Math.max(0, base - patientPays).toFixed(2)),
        patientPays,
        note: plan.oopShareModel.note,
      };
    });

    return {
      settingId,
      setting: getSettingLabel(settingId, activeLocalContext),
      description: settingDescriptions[settingId] ?? "Outpatient benchmark setting.",
      baseMedicareRate: base,
      benchmarkType: "cms-anchor" as const,
      plans,
      settingType: getSettingType(settingId, activeLocalContext),
    };
  });

  let bestSetting = treatmentSettings[0];
  let bestPlan = treatmentSettings[0].plans[0];
  let lowest = Number.POSITIVE_INFINITY;
  let highest = 0;

  treatmentSettings.forEach((setting, settingIndex) => {
    setting.plans.forEach((plan) => {
      if (plan.patientPays == null) return;

      const isBetter =
        plan.patientPays < lowest ||
        (plan.patientPays === lowest &&
          settingIndex < condition.validSettings.indexOf(bestSetting.settingId ?? condition.validSettings[0]));

      if (isBetter) {
        lowest = plan.patientPays;
        bestSetting = setting;
        bestPlan = plan;
      }

      if (plan.patientPays > highest) {
        highest = plan.patientPays;
      }
    });
  });

  const locationSuffix = activeLocalContext ? ` (Cost estimates adjusted for ${activeLocalContext.locationLabel})` : "";
  const extendedSummary = [condition.summary, ...(condition.careNotes ?? [])].join(" ") + locationSuffix;
  const stateMedicaid = planProfiles.find((plan) => plan.planKind === "medicaid")?.displayName ?? "State Medicaid";

  return treatmentExplorerResultSchema.parse({
    condition: condition.name,
    supported: true,
    summary: extendedSummary,
    cptCodes: condition.cptCodes,
    treatmentSettings,
    recommendation: {
      optimalSetting: bestSetting.setting,
      optimalPlan: bestPlan.name,
      reasoning: `${bestPlan.name === stateMedicaid ? `${stateMedicaid} provides the lowest modeled out-of-pocket cost for essential services in this market. ` : ""}${bestSetting.setting} is the recommended starting point because it balances lower patient cost with clinically appropriate follow-up for ${condition.name.toLowerCase()}.`,
      savingsVsWorstCase: Number((highest - lowest).toFixed(2)),
      tips:
        condition.slug === "type-1-diabetes"
          ? [
              "Enroll in Medicare Part D or extra-help programs if eligible; insulin copays can drop materially with the right pharmacy benefit.",
              "Ask the endocrinology team about manufacturer copay support for insulin, pumps, and CGM devices before the prescription is filled.",
              "Use certified diabetes education sessions early; they are usually covered and help reduce urgent-care escalation later.",
              "Request 90-day insulin and supply fills when allowed because refill cadence often changes effective patient cost.",
              "Schedule preventive foot and eye screening through covered outpatient channels to avoid higher-cost complication care.",
              `If uninsured or underinsured, check whether ${stateMedicaid} or local assistance programs can be activated before specialist follow-up.`,
            ]
          : [
              "Ask whether this episode can stay in an outpatient setting instead of a hospital facility.",
              "Confirm prior authorization early if imaging or specialty follow-up is likely.",
              "Use benchmark pricing to challenge unexpectedly high quotes before scheduling.",
            ],
    },
    methodology: buildMethodology(activeLocalContext?.locationLabel),
    localContext: activeLocalContext,
  });
}
