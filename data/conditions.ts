export type ConditionDefinition = {
  slug: string;
  name: string;
  summary: string;
  careNotes?: string[];
  cptCodes: Array<{
    code: string;
    description: string;
    category: string;
    medicareRate: number;
  }>;
  validSettings: string[];
  pricingAnchors: Record<string, number>;
  notes?: string[];
};

export const conditionDefinitions: ConditionDefinition[] = [
  {
    slug: "type-1-diabetes",
    name: "Type 1 Diabetes Mellitus",
    summary:
      "Type 1 diabetes is an autoimmune condition requiring lifelong insulin therapy, frequent monitoring, and comprehensive disease management.",
    careNotes: [
      "Optimal care usually includes endocrinology review, periodic lab monitoring, insulin management, and structured diabetes education.",
      "The lowest-cost path is rarely the emergency department unless there is acute decompensation or severe hypoglycemia.",
    ],
    cptCodes: [
      {
        code: "99213",
        description: "Office visit, established patient, low complexity",
        category: "Evaluation",
        medicareRate: 108.5,
      },
      {
        code: "99214",
        description: "Office visit, established patient, moderate complexity",
        category: "Evaluation",
        medicareRate: 165.75,
      },
      {
        code: "80053",
        description: "Comprehensive metabolic panel (includes glucose, electrolytes, kidney/liver function)",
        category: "Lab",
        medicareRate: 18.92,
      },
      {
        code: "83036",
        description: "Hemoglobin A1c (glycated hemoglobin) - quantitative",
        category: "Lab",
        medicareRate: 12.45,
      },
      {
        code: "82947",
        description: "Glucose blood test",
        category: "Lab",
        medicareRate: 3.5,
      },
      {
        code: "90834",
        description: "Psychotherapy, 45 minutes (diabetes-related mental health support)",
        category: "Therapy",
        medicareRate: 89.25,
      },
    ],
    validSettings: ["endocrinology-clinic", "primary-care", "hospital-education", "retail-pharmacy", "urgent-care"],
    pricingAnchors: {
      "endocrinology-clinic": 165.75,
      "primary-care": 108.5,
      "hospital-education": 245.5,
      "retail-pharmacy": 125,
      "urgent-care": 450,
    },
    notes: [
      "Specialist follow-up is usually the clinically preferred outpatient anchor.",
      "Retail pharmacy pricing mainly reflects medication and supply pickup rather than diagnostic escalation.",
    ],
  },
  {
    slug: "uti",
    name: "Urinary Tract Infection",
    summary: "A common outpatient infection usually managed through evaluation, urine testing, and oral medication.",
    cptCodes: [
      { code: "99213", description: "Established patient office visit", category: "Evaluation", medicareRate: 92 },
      { code: "81003", description: "Automated urinalysis", category: "Lab", medicareRate: 8 },
      { code: "87086", description: "Urine culture", category: "Lab", medicareRate: 17 },
    ],
    validSettings: ["primary-care", "urgent-care", "telehealth"],
    pricingAnchors: { "primary-care": 117, "urgent-care": 146, telehealth: 88 },
  },
  {
    slug: "strep-throat",
    name: "Strep Throat Workup",
    summary: "Usually treated with a focused exam, rapid testing, and outpatient medication.",
    cptCodes: [
      { code: "99213", description: "Established patient office visit", category: "Evaluation", medicareRate: 92 },
      { code: "87880", description: "Rapid strep test", category: "Lab", medicareRate: 18 },
    ],
    validSettings: ["primary-care", "urgent-care", "telehealth"],
    pricingAnchors: { "primary-care": 110, "urgent-care": 142, telehealth: 84 },
  },
  {
    slug: "hypertension-follow-up",
    name: "Hypertension Follow-up",
    summary: "Ongoing blood pressure management is typically handled in primary care or telehealth with periodic labs.",
    cptCodes: [
      { code: "99214", description: "Established patient visit level 4", category: "Evaluation", medicareRate: 130 },
      { code: "80048", description: "Basic metabolic panel", category: "Lab", medicareRate: 14 },
    ],
    validSettings: ["primary-care", "telehealth"],
    pricingAnchors: { "primary-care": 144, telehealth: 118 },
  },
  {
    slug: "type-2-diabetes-follow-up",
    name: "Type 2 Diabetes Follow-up",
    summary: "Routine diabetes management often combines office visits with A1c monitoring and medication review.",
    cptCodes: [
      { code: "99214", description: "Established patient visit level 4", category: "Evaluation", medicareRate: 130 },
      { code: "83036", description: "Hemoglobin A1c", category: "Lab", medicareRate: 13 },
      { code: "80053", description: "Comprehensive metabolic panel", category: "Lab", medicareRate: 15 },
    ],
    validSettings: ["primary-care", "specialist", "telehealth"],
    pricingAnchors: { "primary-care": 158, specialist: 184, telehealth: 124 },
  },
  {
    slug: "sinus-infection",
    name: "Sinus Infection",
    summary: "Most uncomplicated sinus infections are managed with outpatient assessment and symptom-based treatment.",
    cptCodes: [
      { code: "99213", description: "Established patient office visit", category: "Evaluation", medicareRate: 92 },
    ],
    validSettings: ["primary-care", "urgent-care", "telehealth"],
    pricingAnchors: { "primary-care": 102, "urgent-care": 135, telehealth: 80 },
  },
  {
    slug: "dermatology-visit",
    name: "Dermatology Visit",
    summary: "A focused skin evaluation is often priced differently between primary care and specialist settings.",
    cptCodes: [
      { code: "99203", description: "New patient office visit", category: "Evaluation", medicareRate: 128 },
    ],
    validSettings: ["specialist", "telehealth"],
    pricingAnchors: { specialist: 162, telehealth: 118 },
  },
  {
    slug: "knee-pain-workup",
    name: "Knee Pain Workup",
    summary: "Evaluation often begins with outpatient assessment and may progress to imaging depending on severity.",
    cptCodes: [
      { code: "99214", description: "Established patient visit level 4", category: "Evaluation", medicareRate: 130 },
      { code: "73564", description: "Knee x-ray complete", category: "Imaging", medicareRate: 38 },
      { code: "73721", description: "MRI lower extremity joint", category: "Imaging", medicareRate: 308 },
    ],
    validSettings: ["primary-care", "urgent-care", "outpatient-imaging", "specialist"],
    pricingAnchors: {
      "primary-care": 170,
      "urgent-care": 188,
      "outpatient-imaging": 324,
      specialist: 214,
    },
  },
  {
    slug: "acl-mri-pathway",
    name: "ACL MRI Pathway",
    summary: "An ACL workup typically requires specialist evaluation plus outpatient MRI instead of urgent care alone.",
    cptCodes: [
      { code: "99203", description: "New patient orthopedic visit", category: "Evaluation", medicareRate: 128 },
      { code: "73721", description: "MRI lower extremity joint", category: "Imaging", medicareRate: 308 },
    ],
    validSettings: ["specialist", "outpatient-imaging"],
    pricingAnchors: { specialist: 194, "outpatient-imaging": 324 },
  },
  {
    slug: "physical-therapy-eval",
    name: "Physical Therapy Evaluation",
    summary: "PT episodes often start with a specialty evaluation and proceed through lower-cost follow-up sessions.",
    cptCodes: [
      { code: "97161", description: "Physical therapy evaluation", category: "Therapy", medicareRate: 96 },
      { code: "97110", description: "Therapeutic exercises", category: "Therapy", medicareRate: 31 },
    ],
    validSettings: ["specialist", "primary-care"],
    pricingAnchors: { specialist: 118, "primary-care": 105 },
  },
  {
    slug: "appendectomy-follow-up",
    name: "Appendectomy Follow-up",
    summary: "Post-surgical follow-up is usually outpatient and should avoid unnecessary high-cost settings.",
    cptCodes: [
      { code: "99024", description: "Postoperative follow-up", category: "Evaluation", medicareRate: 0 },
      { code: "99213", description: "Established patient office visit", category: "Evaluation", medicareRate: 92 },
    ],
    validSettings: ["specialist", "telehealth"],
    pricingAnchors: { specialist: 96, telehealth: 76 },
  },
];

export const supportedConditionNames = conditionDefinitions.map((item) => item.name);
