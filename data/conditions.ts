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

function simpleCondition(config: {
  slug: string;
  name: string;
  summary: string;
  validSettings: string[];
  pricingAnchors: Record<string, number>;
  cptCodes?: ConditionDefinition["cptCodes"];
  careNotes?: string[];
  notes?: string[];
}): ConditionDefinition {
  return {
    cptCodes: config.cptCodes ?? [
      { code: "99213", description: "Established patient office visit", category: "Evaluation", medicareRate: 92 },
    ],
    careNotes: config.careNotes,
    notes: config.notes,
    ...config,
  };
}

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
  simpleCondition({
    slug: "ear-infection",
    name: "Ear Infection",
    summary: "Most uncomplicated ear infections are handled through outpatient evaluation, exam, and oral medication.",
    validSettings: ["primary-care", "urgent-care", "telehealth"],
    pricingAnchors: { "primary-care": 104, "urgent-care": 138, telehealth: 82 },
    cptCodes: [
      { code: "99213", description: "Established patient office visit", category: "Evaluation", medicareRate: 92 },
      { code: "92567", description: "Tympanometry", category: "Diagnostic", medicareRate: 20 },
    ],
  }),
  simpleCondition({
    slug: "pink-eye",
    name: "Pink Eye",
    summary: "Conjunctivitis is usually diagnosed clinically and managed in low-acuity outpatient settings.",
    validSettings: ["primary-care", "urgent-care", "telehealth"],
    pricingAnchors: { "primary-care": 98, "urgent-care": 132, telehealth: 76 },
  }),
  simpleCondition({
    slug: "bronchitis",
    name: "Bronchitis",
    summary: "Routine bronchitis visits usually involve exam, symptom review, and medication guidance rather than hospital care.",
    validSettings: ["primary-care", "urgent-care", "telehealth"],
    pricingAnchors: { "primary-care": 112, "urgent-care": 148, telehealth: 84 },
  }),
  simpleCondition({
    slug: "pneumonia-follow-up",
    name: "Pneumonia Follow-up",
    summary: "Follow-up after pneumonia often combines outpatient reassessment with imaging only when symptoms persist.",
    validSettings: ["primary-care", "urgent-care", "outpatient-imaging"],
    pricingAnchors: { "primary-care": 126, "urgent-care": 162, "outpatient-imaging": 210 },
    cptCodes: [
      { code: "99214", description: "Established patient visit level 4", category: "Evaluation", medicareRate: 130 },
      { code: "71046", description: "Chest x-ray, two views", category: "Imaging", medicareRate: 34 },
    ],
  }),
  simpleCondition({
    slug: "asthma-follow-up",
    name: "Asthma Follow-up",
    summary: "Asthma management is usually anchored in primary care or pulmonology with spirometry when symptoms change.",
    validSettings: ["primary-care", "specialist", "telehealth"],
    pricingAnchors: { "primary-care": 132, specialist: 178, telehealth: 96 },
    cptCodes: [
      { code: "99214", description: "Established patient visit level 4", category: "Evaluation", medicareRate: 130 },
      { code: "94010", description: "Spirometry", category: "Diagnostic", medicareRate: 36 },
    ],
  }),
  simpleCondition({
    slug: "migraine-visit",
    name: "Migraine Visit",
    summary: "Most migraine care starts with outpatient evaluation, medication adjustment, and symptom-trigger review.",
    validSettings: ["primary-care", "urgent-care", "specialist", "telehealth"],
    pricingAnchors: { "primary-care": 126, "urgent-care": 168, specialist: 188, telehealth: 94 },
  }),
  simpleCondition({
    slug: "back-pain-workup",
    name: "Back Pain Workup",
    summary: "Back pain usually begins with outpatient evaluation and conservative treatment before advanced imaging.",
    validSettings: ["primary-care", "urgent-care", "specialist", "outpatient-imaging"],
    pricingAnchors: { "primary-care": 136, "urgent-care": 174, specialist: 192, "outpatient-imaging": 286 },
    cptCodes: [
      { code: "99214", description: "Established patient visit level 4", category: "Evaluation", medicareRate: 130 },
      { code: "72148", description: "MRI lumbar spine without contrast", category: "Imaging", medicareRate: 285 },
    ],
  }),
  simpleCondition({
    slug: "shoulder-pain-workup",
    name: "Shoulder Pain Workup",
    summary: "Shoulder pain often needs outpatient evaluation first, with imaging reserved for persistent or traumatic cases.",
    validSettings: ["primary-care", "urgent-care", "specialist", "outpatient-imaging"],
    pricingAnchors: { "primary-care": 134, "urgent-care": 170, specialist: 198, "outpatient-imaging": 302 },
    cptCodes: [
      { code: "99214", description: "Established patient visit level 4", category: "Evaluation", medicareRate: 130 },
      { code: "73221", description: "MRI upper extremity joint", category: "Imaging", medicareRate: 298 },
    ],
  }),
  simpleCondition({
    slug: "ankle-sprain",
    name: "Ankle Sprain",
    summary: "Most ankle sprains are managed with outpatient exam, bracing, and selective x-ray rather than hospital care.",
    validSettings: ["primary-care", "urgent-care", "specialist"],
    pricingAnchors: { "primary-care": 120, "urgent-care": 154, specialist: 176 },
    cptCodes: [
      { code: "99213", description: "Established patient office visit", category: "Evaluation", medicareRate: 92 },
      { code: "73610", description: "Ankle x-ray complete", category: "Imaging", medicareRate: 32 },
    ],
  }),
  simpleCondition({
    slug: "sleep-apnea-consult",
    name: "Sleep Apnea Consult",
    summary: "Sleep apnea evaluation often starts with outpatient consultation and lower-cost home testing before lab studies.",
    validSettings: ["primary-care", "specialist", "telehealth"],
    pricingAnchors: { "primary-care": 122, specialist: 202, telehealth: 90 },
    cptCodes: [
      { code: "99204", description: "New patient consult", category: "Evaluation", medicareRate: 169 },
      { code: "95806", description: "Home sleep study", category: "Diagnostic", medicareRate: 142 },
    ],
  }),
  simpleCondition({
    slug: "thyroid-follow-up",
    name: "Thyroid Follow-up",
    summary: "Routine thyroid management typically combines office follow-up with low-cost lab monitoring.",
    validSettings: ["primary-care", "specialist", "telehealth"],
    pricingAnchors: { "primary-care": 118, specialist: 162, telehealth: 88 },
    cptCodes: [
      { code: "99213", description: "Established patient office visit", category: "Evaluation", medicareRate: 92 },
      { code: "84443", description: "TSH laboratory test", category: "Lab", medicareRate: 18 },
    ],
  }),
  simpleCondition({
    slug: "cholesterol-follow-up",
    name: "Cholesterol Follow-up",
    summary: "Lipid management is usually handled in primary care with periodic lab review and medication adjustment.",
    validSettings: ["primary-care", "telehealth"],
    pricingAnchors: { "primary-care": 108, telehealth: 80 },
    cptCodes: [
      { code: "99213", description: "Established patient office visit", category: "Evaluation", medicareRate: 92 },
      { code: "80061", description: "Lipid panel", category: "Lab", medicareRate: 17 },
    ],
  }),
  simpleCondition({
    slug: "annual-physical",
    name: "Annual Physical",
    summary: "Preventive care is usually most efficient in primary care, with labs added only when clinically appropriate.",
    validSettings: ["primary-care"],
    pricingAnchors: { "primary-care": 158 },
    cptCodes: [
      { code: "99395", description: "Preventive medicine visit, established patient", category: "Preventive", medicareRate: 138 },
      { code: "80053", description: "Comprehensive metabolic panel", category: "Lab", medicareRate: 15 },
    ],
  }),
  simpleCondition({
    slug: "contraception-consult",
    name: "Contraception Consult",
    summary: "Contraception counseling and medication management are usually outpatient and often telehealth-appropriate.",
    validSettings: ["primary-care", "specialist", "telehealth"],
    pricingAnchors: { "primary-care": 116, specialist: 154, telehealth: 82 },
  }),
  simpleCondition({
    slug: "pregnancy-confirmation-visit",
    name: "Pregnancy Confirmation Visit",
    summary: "Early pregnancy confirmation usually involves outpatient evaluation, testing, and referral into prenatal care.",
    validSettings: ["primary-care", "specialist", "urgent-care"],
    pricingAnchors: { "primary-care": 124, specialist: 168, "urgent-care": 156 },
    cptCodes: [
      { code: "99213", description: "Established patient office visit", category: "Evaluation", medicareRate: 92 },
      { code: "81025", description: "Urine pregnancy test", category: "Lab", medicareRate: 9 },
    ],
  }),
  simpleCondition({
    slug: "depression-follow-up",
    name: "Depression Follow-up",
    summary: "Depression management is often safely handled through outpatient follow-up, therapy, and medication adjustment.",
    validSettings: ["primary-care", "specialist", "telehealth"],
    pricingAnchors: { "primary-care": 122, specialist: 176, telehealth: 92 },
    cptCodes: [
      { code: "99214", description: "Established patient visit level 4", category: "Evaluation", medicareRate: 130 },
      { code: "90834", description: "Psychotherapy, 45 minutes", category: "Therapy", medicareRate: 89.25 },
    ],
  }),
  simpleCondition({
    slug: "anxiety-follow-up",
    name: "Anxiety Follow-up",
    summary: "Anxiety follow-up often stays in lower-cost outpatient or virtual settings unless symptoms escalate.",
    validSettings: ["primary-care", "specialist", "telehealth"],
    pricingAnchors: { "primary-care": 118, specialist: 172, telehealth: 88 },
    cptCodes: [
      { code: "99213", description: "Established patient office visit", category: "Evaluation", medicareRate: 92 },
      { code: "90834", description: "Psychotherapy, 45 minutes", category: "Therapy", medicareRate: 89.25 },
    ],
  }),
  simpleCondition({
    slug: "gerd-follow-up",
    name: "GERD Follow-up",
    summary: "Most reflux follow-up stays in primary care with medication review before specialty escalation.",
    validSettings: ["primary-care", "specialist", "telehealth"],
    pricingAnchors: { "primary-care": 114, specialist: 168, telehealth: 84 },
  }),
  simpleCondition({
    slug: "ibs-follow-up",
    name: "IBS Follow-up",
    summary: "Irritable bowel syndrome follow-up usually begins with lower-cost outpatient management before higher-cost testing.",
    validSettings: ["primary-care", "specialist", "telehealth"],
    pricingAnchors: { "primary-care": 120, specialist: 182, telehealth: 90 },
  }),
  simpleCondition({
    slug: "kidney-stone-follow-up",
    name: "Kidney Stone Follow-up",
    summary: "Kidney stone follow-up usually combines outpatient reassessment, medication review, and selective imaging.",
    validSettings: ["primary-care", "specialist", "outpatient-imaging"],
    pricingAnchors: { "primary-care": 128, specialist: 188, "outpatient-imaging": 238 },
    cptCodes: [
      { code: "99214", description: "Established patient visit level 4", category: "Evaluation", medicareRate: 130 },
      { code: "74018", description: "Abdominal x-ray", category: "Imaging", medicareRate: 30 },
    ],
  }),
];

export const supportedConditionNames = conditionDefinitions.map((item) => item.name);
