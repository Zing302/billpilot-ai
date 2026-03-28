export type LocalMarketPlan = {
  id: string;
  issuer: string;
  displayName: string;
  networkType: "PPO" | "HMO" | "EPO" | "Public";
  planKind: "medicare" | "medicaid" | "commercial";
  medicalCopayModel: {
    patientShare: number;
    flatBySetting?: Record<string, number>;
  };
  pharmacyCopayModel: {
    patientShare: number;
    flatBySetting?: Record<string, number>;
  };
  oopShareModel: {
    maxPatientShare: number;
    note: string;
  };
  stateProgram?: string;
};

export type LocalMarketContext = {
  zipCode: string;
  locationLabel: string;
  regionalNote: string;
  insurers: string[];
  insurancePlans: string[];
  facilities: Array<{ name: string; type: string; settingId?: string }>;
  plans: LocalMarketPlan[];
};

export function normalizeZipCode(zipCode?: string): string | undefined {
  const trimmed = zipCode?.trim();
  if (!trimmed) return undefined;
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length >= 5) return digits.slice(0, 5);
  return trimmed;
}

type LocalMarketSeed = Omit<LocalMarketContext, "insurancePlans"> & {
  zipPrefixes: string[];
  insurancePlans?: string[];
};

type StateRange = {
  start: number;
  end: number;
  state: string;
};

type MetroFallback = {
  prefixes: string[];
  label: string;
  state: string;
  insurers: string[];
  note: string;
};

const nationalStateRanges: StateRange[] = [
  { start: 10, end: 27, state: "Massachusetts" },
  { start: 28, end: 29, state: "Rhode Island" },
  { start: 30, end: 38, state: "New Hampshire" },
  { start: 39, end: 49, state: "Maine" },
  { start: 50, end: 59, state: "Vermont" },
  { start: 60, end: 69, state: "Connecticut" },
  { start: 70, end: 89, state: "New Jersey" },
  { start: 100, end: 149, state: "New York" },
  { start: 150, end: 196, state: "Pennsylvania" },
  { start: 197, end: 199, state: "Delaware" },
  { start: 200, end: 205, state: "District of Columbia" },
  { start: 206, end: 219, state: "Maryland" },
  { start: 220, end: 246, state: "Virginia" },
  { start: 247, end: 268, state: "West Virginia" },
  { start: 270, end: 289, state: "North Carolina" },
  { start: 290, end: 299, state: "South Carolina" },
  { start: 300, end: 319, state: "Georgia" },
  { start: 320, end: 349, state: "Florida" },
  { start: 350, end: 369, state: "Alabama" },
  { start: 370, end: 385, state: "Tennessee" },
  { start: 386, end: 397, state: "Mississippi" },
  { start: 400, end: 427, state: "Kentucky" },
  { start: 430, end: 459, state: "Ohio" },
  { start: 460, end: 479, state: "Indiana" },
  { start: 480, end: 499, state: "Michigan" },
  { start: 500, end: 528, state: "Iowa" },
  { start: 530, end: 549, state: "Wisconsin" },
  { start: 550, end: 567, state: "Minnesota" },
  { start: 570, end: 577, state: "South Dakota" },
  { start: 580, end: 588, state: "North Dakota" },
  { start: 590, end: 599, state: "Montana" },
  { start: 600, end: 629, state: "Illinois" },
  { start: 630, end: 658, state: "Missouri" },
  { start: 660, end: 679, state: "Kansas" },
  { start: 680, end: 693, state: "Nebraska" },
  { start: 700, end: 714, state: "Louisiana" },
  { start: 716, end: 729, state: "Arkansas" },
  { start: 730, end: 749, state: "Oklahoma" },
  { start: 750, end: 799, state: "Texas" },
  { start: 800, end: 816, state: "Colorado" },
  { start: 820, end: 831, state: "Wyoming" },
  { start: 832, end: 838, state: "Idaho" },
  { start: 840, end: 847, state: "Utah" },
  { start: 850, end: 865, state: "Arizona" },
  { start: 870, end: 884, state: "New Mexico" },
  { start: 885, end: 885, state: "Texas" },
  { start: 889, end: 898, state: "Nevada" },
  { start: 900, end: 961, state: "California" },
  { start: 967, end: 968, state: "Hawaii" },
  { start: 970, end: 979, state: "Oregon" },
  { start: 980, end: 994, state: "Washington" },
  { start: 995, end: 999, state: "Alaska" },
];

const metroFallbacks: MetroFallback[] = [
  {
    prefixes: ["021", "022", "023", "024"],
    label: "Boston Metro, Massachusetts",
    state: "Massachusetts",
    insurers: ["Blue Cross Blue Shield of Massachusetts", "Harvard Pilgrim", "Tufts Health Plan", "Aetna"],
    note: "Large academic systems and referral patterns in greater Boston can widen the gap between specialist and hospital-based outpatient pricing.",
  },
  {
    prefixes: ["331", "332", "333"],
    label: "Miami Metro, Florida",
    state: "Florida",
    insurers: ["Florida Blue", "Aetna", "UnitedHealthcare", "Cigna"],
    note: "South Florida pricing varies heavily by hospital affiliation and network design, especially for urgent and outpatient specialty care.",
  },
  {
    prefixes: ["770", "772", "773", "774", "775"],
    label: "Houston Metro, Texas",
    state: "Texas",
    insurers: ["Blue Cross Blue Shield of Texas", "Aetna", "United Healthcare", "Cigna"],
    note: "Houston has dense hospital competition, but patient responsibility still swings sharply by network and site-of-care selection.",
  },
  {
    prefixes: ["802", "803", "804"],
    label: "Denver Metro, Colorado",
    state: "Colorado",
    insurers: ["Anthem Blue Cross Blue Shield", "UnitedHealthcare", "Aetna", "Cigna"],
    note: "Outpatient and urgent-care pathways are often strong substitutes for hospital-based episodes across the Front Range.",
  },
  {
    prefixes: ["921", "922"],
    label: "San Diego, California",
    state: "California",
    insurers: ["Blue Shield of California", "Kaiser Permanente", "Aetna", "UnitedHealthcare"],
    note: "Southern California networks can keep routine endocrine and outpatient episodes affordable when patients avoid hospital-heavy sites.",
  },
  {
    prefixes: ["958"],
    label: "Sacramento, California",
    state: "California",
    insurers: ["Blue Shield of California", "Kaiser Permanente", "Aetna", "UnitedHealthcare"],
    note: "Sacramento pricing tends to favor outpatient clinic and imaging settings over hospital-affiliated specialty episodes.",
  },
  {
    prefixes: ["972", "973"],
    label: "Portland Metro, Oregon",
    state: "Oregon",
    insurers: ["Regence BlueCross BlueShield", "Providence Health Plan", "Kaiser Permanente", "Aetna"],
    note: "Portland-area outpatient networks often keep routine chronic care lower cost than hospital system pathways.",
  },
  {
    prefixes: ["980", "981"],
    label: "Seattle Metro, Washington",
    state: "Washington",
    insurers: ["Premera Blue Cross", "Regence BlueShield", "Kaiser Permanente", "Aetna"],
    note: "Seattle specialty access is strong, but patient cost can rise quickly once hospital-owned clinics or urgent settings enter the episode.",
  },
];

const stateFallbackInsurers: Record<string, string[]> = {
  Alabama: ["Blue Cross Blue Shield of Alabama", "UnitedHealthcare", "Aetna", "Cigna"],
  Alaska: ["Premera Blue Cross", "Aetna", "UnitedHealthcare", "Moda Health"],
  Arizona: ["Blue Cross Blue Shield of Arizona", "UnitedHealthcare", "Aetna", "Cigna"],
  Arkansas: ["Arkansas Blue Cross Blue Shield", "UnitedHealthcare", "Aetna", "QualChoice"],
  California: ["Blue Shield of California", "Kaiser Permanente", "Aetna", "UnitedHealthcare"],
  Colorado: ["Anthem Blue Cross Blue Shield", "UnitedHealthcare", "Aetna", "Cigna"],
  Connecticut: ["Anthem Blue Cross Blue Shield", "Aetna", "Cigna", "UnitedHealthcare"],
  Delaware: ["Highmark Blue Cross Blue Shield Delaware", "Aetna", "Cigna", "UnitedHealthcare"],
  "District of Columbia": ["CareFirst BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare"],
  Florida: ["Florida Blue", "Aetna", "UnitedHealthcare", "Cigna"],
  Georgia: ["Anthem Blue Cross Blue Shield", "Aetna", "UnitedHealthcare", "Kaiser Permanente"],
  Hawaii: ["HMSA Blue Cross Blue Shield", "Kaiser Permanente", "Aetna", "UnitedHealthcare"],
  Idaho: ["Blue Cross of Idaho", "Regence BlueShield", "Select Health", "Aetna"],
  Illinois: ["Blue Cross Blue Shield of Illinois", "Aetna", "UnitedHealthcare", "Cigna"],
  Indiana: ["Anthem Blue Cross Blue Shield", "UnitedHealthcare", "Aetna", "Cigna"],
  Iowa: ["Wellmark Blue Cross Blue Shield", "UnitedHealthcare", "Aetna", "Medica"],
  Kansas: ["Blue Cross Blue Shield of Kansas", "UnitedHealthcare", "Aetna", "Cigna"],
  Kentucky: ["Anthem Blue Cross Blue Shield", "Humana", "Aetna", "UnitedHealthcare"],
  Louisiana: ["Blue Cross Blue Shield of Louisiana", "UnitedHealthcare", "Aetna", "Humana"],
  Maine: ["Anthem Blue Cross Blue Shield", "Harvard Pilgrim", "Aetna", "Cigna"],
  Maryland: ["CareFirst BlueCross BlueShield", "Aetna", "UnitedHealthcare", "Cigna"],
  Massachusetts: ["Blue Cross Blue Shield of Massachusetts", "Harvard Pilgrim", "Tufts Health Plan", "Aetna"],
  Michigan: ["Blue Cross Blue Shield of Michigan", "Priority Health", "Aetna", "UnitedHealthcare"],
  Minnesota: ["Blue Cross Blue Shield of Minnesota", "Medica", "HealthPartners", "UnitedHealthcare"],
  Mississippi: ["Blue Cross Blue Shield of Mississippi", "UnitedHealthcare", "Aetna", "Cigna"],
  Missouri: ["Blue Cross Blue Shield of Kansas City", "Anthem Blue Cross Blue Shield", "UnitedHealthcare", "Aetna"],
  Montana: ["Blue Cross Blue Shield of Montana", "PacificSource", "UnitedHealthcare", "Aetna"],
  Nebraska: ["Blue Cross Blue Shield of Nebraska", "UnitedHealthcare", "Aetna", "Medica"],
  Nevada: ["Anthem Blue Cross Blue Shield", "UnitedHealthcare", "Aetna", "Health Plan of Nevada"],
  "New Hampshire": ["Anthem Blue Cross Blue Shield", "Harvard Pilgrim", "Aetna", "UnitedHealthcare"],
  "New Jersey": ["Horizon Blue Cross Blue Shield", "Aetna", "UnitedHealthcare", "Cigna"],
  "New Mexico": ["Blue Cross Blue Shield of New Mexico", "Presbyterian", "Molina", "UnitedHealthcare"],
  "New York": ["Empire BlueCross BlueShield", "UnitedHealthcare", "Aetna", "Cigna"],
  "North Carolina": ["Blue Cross Blue Shield of North Carolina", "Aetna", "UnitedHealthcare", "Cigna"],
  "North Dakota": ["Blue Cross Blue Shield of North Dakota", "Sanford Health Plan", "Medica", "Aetna"],
  Ohio: ["Anthem Blue Cross Blue Shield", "Medical Mutual", "Aetna", "UnitedHealthcare"],
  Oklahoma: ["Blue Cross Blue Shield of Oklahoma", "Aetna", "UnitedHealthcare", "Cigna"],
  Oregon: ["Regence BlueCross BlueShield", "Providence Health Plan", "Kaiser Permanente", "Aetna"],
  Pennsylvania: ["Independence Blue Cross", "UPMC Health Plan", "Aetna", "UnitedHealthcare"],
  "Rhode Island": ["Blue Cross Blue Shield of Rhode Island", "UnitedHealthcare", "Aetna", "Tufts Health Plan"],
  "South Carolina": ["Blue Cross Blue Shield of South Carolina", "Aetna", "UnitedHealthcare", "Cigna"],
  "South Dakota": ["Wellmark Blue Cross Blue Shield", "Avera Health Plans", "Sanford Health Plan", "Aetna"],
  Tennessee: ["Blue Cross Blue Shield of Tennessee", "Cigna", "UnitedHealthcare", "Aetna"],
  Texas: ["Blue Cross Blue Shield of Texas", "Aetna", "United Healthcare", "Cigna"],
  Utah: ["Regence BlueCross BlueShield", "Select Health", "UnitedHealthcare", "Aetna"],
  Vermont: ["Blue Cross Blue Shield of Vermont", "MVP Health Care", "Cigna", "Aetna"],
  Virginia: ["Anthem Blue Cross Blue Shield", "Sentara Health Plans", "Aetna", "UnitedHealthcare"],
  Washington: ["Premera Blue Cross", "Regence BlueShield", "Kaiser Permanente", "Aetna"],
  "West Virginia": ["Highmark Blue Cross Blue Shield", "Peak Health", "Aetna", "UnitedHealthcare"],
  Wisconsin: ["Anthem Blue Cross Blue Shield", "Quartz", "UnitedHealthcare", "Aetna"],
  Wyoming: ["Blue Cross Blue Shield of Wyoming", "UnitedHealthcare", "Aetna", "Cigna"],
};

function stateMedicaidLabel(locationLabel: string): string {
  const lower = locationLabel.toLowerCase();
  if (lower.includes("texas")) return "Texas Medicaid";
  if (lower.includes("illinois")) return "Illinois Medicaid";
  if (lower.includes("georgia")) return "Georgia Medicaid";
  if (lower.includes("arizona")) return "Arizona Medicaid";
  if (lower.includes("new york")) return "New York Medicaid";
  if (lower.includes("california")) return "Medi-Cal";
  return "State Medicaid";
}

function buildPlan(
  id: string,
  issuer: string,
  displayName: string,
  networkType: LocalMarketPlan["networkType"],
  planKind: LocalMarketPlan["planKind"],
  medical: LocalMarketPlan["medicalCopayModel"],
  pharmacy: LocalMarketPlan["pharmacyCopayModel"],
  note: string,
  stateProgram?: string,
): LocalMarketPlan {
  return {
    id,
    issuer,
    displayName,
    networkType,
    planKind,
    medicalCopayModel: medical,
    pharmacyCopayModel: pharmacy,
    oopShareModel: {
      maxPatientShare: medical.patientShare,
      note,
    },
    stateProgram,
  };
}

function commercialPlan(
  issuer: string,
  displayName: string,
  networkType: LocalMarketPlan["networkType"],
  medicalShare: number,
  pharmacyShare: number,
  medicalFlats: Record<string, number>,
  pharmacyFlats: Record<string, number>,
  note: string,
): LocalMarketPlan {
  return buildPlan(
    displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    issuer,
    displayName,
    networkType,
    "commercial",
    { patientShare: medicalShare, flatBySetting: medicalFlats },
    { patientShare: pharmacyShare, flatBySetting: pharmacyFlats },
    note,
  );
}

function publicPlan(
  id: string,
  displayName: string,
  planKind: "medicare" | "medicaid",
  medicalFlats: Record<string, number>,
  pharmacyFlats: Record<string, number>,
  note: string,
  stateProgram?: string,
): LocalMarketPlan {
  return buildPlan(
    id,
    displayName.replace(/\s+\(.+\)$/, ""),
    displayName,
    "Public",
    planKind,
    { patientShare: planKind === "medicare" ? 0.2 : 0, flatBySetting: medicalFlats },
    { patientShare: planKind === "medicare" ? 0.24 : 0, flatBySetting: pharmacyFlats },
    note,
    stateProgram,
  );
}

function standardCommercialPlans(
  locationLabel: string,
  insurers: string[],
  overrides?: Partial<
    Record<
      string,
      Partial<Omit<LocalMarketPlan, "medicalCopayModel" | "pharmacyCopayModel" | "oopShareModel">> & {
        medicalCopayModel?: Partial<LocalMarketPlan["medicalCopayModel"]>;
        pharmacyCopayModel?: Partial<LocalMarketPlan["pharmacyCopayModel"]>;
        oopShareModel?: Partial<LocalMarketPlan["oopShareModel"]>;
      }
    >
  >,
): LocalMarketPlan[] {
  const fallbackIssuers = ["Blue Cross Blue Shield", "Aetna", "UnitedHealthcare", "Cigna"];
  const resolvedIssuers = Array.from({ length: 4 }, (_, index) => insurers[index] ?? fallbackIssuers[index]);

  const defaults = [
    commercialPlan(
      resolvedIssuers[0],
      `${resolvedIssuers[0]} PPO`,
      "PPO",
      0.15,
      0.18,
      {
        "endocrinology-clinic": 18,
        "primary-care": 12,
        "hospital-education": 60,
        "retail-pharmacy": 32,
        "urgent-care": 160,
        specialist: 30,
        "hospital-outpatient": 90,
        "outpatient-imaging": 80,
        telehealth: 12,
      },
      {
        "retail-pharmacy": 28,
      },
      `Preferred ${locationLabel} PPO profile with lower office copays and steeper hospital exposure.`,
    ),
    commercialPlan(
      resolvedIssuers[1],
      `${resolvedIssuers[1]} EPO`,
      "EPO",
      0.16,
      0.17,
      {
        "endocrinology-clinic": 22,
        "primary-care": 10,
        "hospital-education": 48,
        "retail-pharmacy": 24,
        "urgent-care": 130,
        specialist: 34,
        "hospital-outpatient": 82,
        "outpatient-imaging": 74,
        telehealth: 8,
      },
      {
        "retail-pharmacy": 24,
      },
      `In-network EPO profile common in ${locationLabel} with lower primary care and pharmacy copays.`,
    ),
    commercialPlan(
      resolvedIssuers[2],
      `${resolvedIssuers[2]} PPO`,
      "PPO",
      0.18,
      0.2,
      {
        "endocrinology-clinic": 28,
        "primary-care": 14,
        "hospital-education": 68,
        "retail-pharmacy": 26,
        "urgent-care": 145,
        specialist: 38,
        "hospital-outpatient": 96,
        "outpatient-imaging": 88,
        telehealth: 14,
      },
      {
        "retail-pharmacy": 26,
      },
      `Broad PPO profile with moderate patient exposure across outpatient settings in ${locationLabel}.`,
    ),
    commercialPlan(
      resolvedIssuers[3],
      `${resolvedIssuers[3]} HMO`,
      "HMO",
      0.22,
      0.22,
      {
        "endocrinology-clinic": 45,
        "primary-care": 20,
        "hospital-education": 100,
        "retail-pharmacy": 32,
        "urgent-care": 220,
        specialist: 48,
        "hospital-outpatient": 118,
        "outpatient-imaging": 112,
        telehealth: 18,
      },
      {
        "retail-pharmacy": 32,
      },
      `HMO-style profile with stronger network steering and higher urgent-care exposure in ${locationLabel}.`,
    ),
  ];

  return defaults.map((plan) => {
    const override = overrides?.[plan.issuer];
    if (!override) return plan;
    return {
      ...plan,
      ...override,
      medicalCopayModel: {
        ...plan.medicalCopayModel,
        ...override.medicalCopayModel,
        flatBySetting: {
          ...plan.medicalCopayModel.flatBySetting,
          ...override.medicalCopayModel?.flatBySetting,
        },
      },
      pharmacyCopayModel: {
        ...plan.pharmacyCopayModel,
        ...override.pharmacyCopayModel,
        flatBySetting: {
          ...plan.pharmacyCopayModel.flatBySetting,
          ...override.pharmacyCopayModel?.flatBySetting,
        },
      },
      oopShareModel: {
        ...plan.oopShareModel,
        ...override.oopShareModel,
      },
    };
  });
}

function standardPublicPlans(locationLabel: string): LocalMarketPlan[] {
  const medicaidLabel = stateMedicaidLabel(locationLabel);
  return [
    publicPlan(
      "medicare-base",
      "Medicare (Parts B+D)",
      "medicare",
      {
        "endocrinology-clinic": 41.57,
        "primary-care": 21.7,
        "hospital-education": 49.1,
        "retail-pharmacy": 62.5,
        "urgent-care": 90,
        specialist: 28,
        "hospital-outpatient": 56,
        "outpatient-imaging": 78,
        telehealth: 18,
      },
      {
        "retail-pharmacy": 62.5,
      },
      `Modeled Medicare outpatient share anchored to CMS benchmark pricing for ${locationLabel}.`,
    ),
    publicPlan(
      medicaidLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      medicaidLabel,
      "medicaid",
      {
        "endocrinology-clinic": 0,
        "primary-care": 0,
        "hospital-education": 0,
        "retail-pharmacy": 0,
        "urgent-care": 0,
        specialist: 0,
        "hospital-outpatient": 0,
        "outpatient-imaging": 0,
        telehealth: 0,
      },
      {
        "retail-pharmacy": 0,
      },
      `${medicaidLabel} profile modeled as zero patient responsibility for covered essential services.`,
      medicaidLabel,
    ),
  ];
}

function insurancePlanNamesFromProfiles(plans: LocalMarketPlan[]): string[] {
  const medicare = plans.find((plan) => plan.planKind === "medicare");
  const commercial = plans.filter((plan) => plan.planKind === "commercial").slice(0, 4);
  const medicaid = plans.find((plan) => plan.planKind === "medicaid");
  return [
    medicare?.displayName ?? "Medicare (Parts B+D)",
    ...commercial.map((plan) => plan.displayName),
    medicaid?.displayName ?? "State Medicaid",
  ];
}

function resolveStateFromPrefix(prefix: string): string | null {
  const numeric = Number(prefix);
  if (Number.isNaN(numeric)) return null;
  const matched = nationalStateRanges.find((range) => numeric >= range.start && numeric <= range.end);
  return matched?.state ?? null;
}

function finalizeMarket(market: Omit<LocalMarketContext, "insurancePlans"> & { insurancePlans?: string[] }): LocalMarketContext {
  return {
    ...market,
    insurancePlans: market.insurancePlans ?? insurancePlanNamesFromProfiles(market.plans),
  };
}

const localMarkets: LocalMarketSeed[] = [
  {
    zipCode: "10001",
    zipPrefixes: ["100", "101", "102"],
    locationLabel: "Manhattan, New York",
    regionalNote: "Dense specialist access and hospital pricing can widen the spread between outpatient and facility-based care.",
    insurers: ["Empire BlueCross BlueShield", "UnitedHealthcare", "Aetna", "Cigna"],
    plans: [
      ...standardPublicPlans("Manhattan, New York"),
      ...standardCommercialPlans("Manhattan, New York", ["Empire BlueCross BlueShield", "Aetna", "UnitedHealthcare", "Cigna"], {
        Cigna: {
          networkType: "HMO",
          displayName: "Cigna HMO",
        },
      }),
    ],
    facilities: [
      { name: "NYU Langone Ambulatory Care", type: "Hospital Outpatient", settingId: "hospital-outpatient" },
      { name: "Mount Sinai Union Square", type: "Urgent Care", settingId: "urgent-care" },
      { name: "CityMD Chelsea", type: "Urgent Care", settingId: "urgent-care" },
      { name: "One Medical Chelsea", type: "Clinic", settingId: "primary-care" },
      { name: "NYU Diabetes Center", type: "Specialty Clinic", settingId: "endocrinology-clinic" },
    ],
  },
  {
    zipCode: "30301",
    zipPrefixes: ["300", "301", "302", "303"],
    locationLabel: "Atlanta, Georgia",
    regionalNote: "Large carrier presence means in-network status can materially change the patient share.",
    insurers: ["Anthem Blue Cross Blue Shield", "Aetna", "UnitedHealthcare", "Kaiser Permanente"],
    plans: [
      ...standardPublicPlans("Atlanta, Georgia"),
      ...standardCommercialPlans("Atlanta, Georgia", ["Anthem Blue Cross Blue Shield", "Aetna", "UnitedHealthcare", "Kaiser Permanente"], {
        "Kaiser Permanente": {
          displayName: "Kaiser HMO",
          networkType: "HMO",
          medicalCopayModel: {
            flatBySetting: {
              "primary-care": 12,
              specialist: 28,
              "urgent-care": 95,
            },
          },
        },
      }),
    ],
    facilities: [
      { name: "Emory at Midtown", type: "Hospital Outpatient", settingId: "hospital-outpatient" },
      { name: "Piedmont QuickCare", type: "Urgent Care", settingId: "urgent-care" },
      { name: "Wellstar Primary Care", type: "Clinic", settingId: "primary-care" },
      { name: "Emory Specialty Clinic", type: "Specialty Clinic", settingId: "specialist" },
    ],
  },
  {
    zipCode: "60601",
    zipPrefixes: ["600", "601", "602", "603", "604", "605", "606", "607", "608"],
    locationLabel: "Chicago, Illinois",
    regionalNote: "Hospital-affiliated clinics can price above independent outpatient settings for the same episode.",
    insurers: ["Blue Cross Blue Shield of Illinois", "Aetna", "UnitedHealthcare", "Cigna"],
    plans: [
      ...standardPublicPlans("Chicago, Illinois"),
      ...standardCommercialPlans("Chicago, Illinois", ["Blue Cross Blue Shield of Illinois", "Aetna", "UnitedHealthcare", "Cigna"]),
    ],
    facilities: [
      { name: "Northwestern Medicine Immediate Care", type: "Urgent Care", settingId: "urgent-care" },
      { name: "Rush University Outpatient Center", type: "Hospital Outpatient", settingId: "hospital-outpatient" },
      { name: "UI Health Primary Care", type: "Clinic", settingId: "primary-care" },
      { name: "Rush Diabetes Center", type: "Specialty Clinic", settingId: "endocrinology-clinic" },
      { name: "Rush Imaging Center", type: "Outpatient Imaging", settingId: "outpatient-imaging" },
    ],
  },
  {
    zipCode: "75201",
    zipPrefixes: ["750", "751", "752", "753"],
    locationLabel: "Dallas-Fort Worth, Texas",
    regionalNote: "Large hospital systems, specialist groups, and wide PPO/EPO variation make network and site-of-care choices especially important across the metro.",
    insurers: ["Blue Cross Blue Shield of Texas", "Aetna", "United Healthcare", "Cigna"],
    plans: [
      ...standardPublicPlans("Dallas-Fort Worth, Texas"),
      ...standardCommercialPlans("Dallas-Fort Worth, Texas", ["Blue Cross Blue Shield of Texas", "Aetna", "United Healthcare", "Cigna"], {
        "Blue Cross Blue Shield of Texas": {
          displayName: "Blue Cross Blue Shield of Texas PPO",
          medicalCopayModel: {
            flatBySetting: {
              "primary-care": 12,
              specialist: 28,
              "urgent-care": 145,
              "hospital-outpatient": 92,
            },
          },
        },
      }),
    ],
    facilities: [
      { name: "Baylor Scott & White Specialty Clinic - DFW", type: "Specialty Clinic", settingId: "endocrinology-clinic" },
      { name: "Texas Health Primary Care - DFW", type: "Clinic", settingId: "primary-care" },
      { name: "UT Southwestern Outpatient Center", type: "Hospital Outpatient", settingId: "hospital-outpatient" },
      { name: "DFW Retail Pharmacy Network", type: "Retail Pharmacy", settingId: "retail-pharmacy" },
      { name: "CareNow Urgent Care - DFW", type: "Urgent Care", settingId: "urgent-care" },
    ],
  },
  {
    zipCode: "76092",
    zipPrefixes: ["760", "761", "762"],
    locationLabel: "Arlington, Texas",
    regionalNote: "Endocrinology clinics, diabetes education centers, and retail pharmacy pricing vary materially across DFW, so the lowest-cost path depends on both setting and plan design.",
    insurers: ["Blue Cross Blue Shield of Texas", "Aetna", "United Healthcare", "Cigna"],
    plans: [
      ...standardPublicPlans("Arlington, Texas"),
      commercialPlan(
        "Blue Cross Blue Shield of Texas",
        "Blue Cross Blue Shield of Texas PPO",
        "PPO",
        0.14,
        0.18,
        {
          "endocrinology-clinic": 15,
          "primary-care": 10,
          "hospital-education": 50,
          "retail-pharmacy": 25,
          "urgent-care": 150,
        },
        {
          "retail-pharmacy": 25,
        },
        "Regional Texas PPO profile with strong specialist access and moderate urgent-care exposure.",
      ),
      commercialPlan(
        "Aetna",
        "Aetna EPO",
        "EPO",
        0.15,
        0.16,
        {
          "endocrinology-clinic": 20,
          "primary-care": 5,
          "hospital-education": 40,
          "retail-pharmacy": 21.25,
          "urgent-care": 125,
        },
        {
          "retail-pharmacy": 21.25,
        },
        "Lower in-network primary and specialty copays common in Dallas-Fort Worth EPO products.",
      ),
      commercialPlan(
        "United Healthcare",
        "United Healthcare PPO",
        "PPO",
        0.18,
        0.18,
        {
          "endocrinology-clinic": 25,
          "primary-care": 10,
          "hospital-education": 60,
          "retail-pharmacy": 22.5,
          "urgent-care": 135,
        },
        {
          "retail-pharmacy": 22.5,
        },
        "Broader PPO network with moderate outpatient copays across the DFW diabetes pathway.",
      ),
      commercialPlan(
        "Cigna",
        "Cigna HMO",
        "HMO",
        0.22,
        0.22,
        {
          "endocrinology-clinic": 45,
          "primary-care": 20,
          "hospital-education": 100,
          "retail-pharmacy": 30,
          "urgent-care": 225,
        },
        {
          "retail-pharmacy": 30,
        },
        "HMO plan with stronger network steering and the highest urgent-care out-of-pocket in the Arlington seed.",
      ),
    ],
    facilities: [
      { name: "Endocrinology Specialty Clinic - Arlington", type: "Specialty Clinic", settingId: "endocrinology-clinic" },
      { name: "Primary Care Office - Arlington", type: "Clinic", settingId: "primary-care" },
      { name: "Hospital-Based Diabetes Education Center", type: "Hospital Outpatient", settingId: "hospital-education" },
      { name: "Retail Pharmacy - Arlington", type: "Retail Pharmacy", settingId: "retail-pharmacy" },
      { name: "Urgent Care/Emergency Department - Diabetic Crisis Management", type: "Urgent Care", settingId: "urgent-care" },
    ],
  },
  {
    zipCode: "73301",
    zipPrefixes: ["733", "786", "787"],
    locationLabel: "Austin, Texas",
    regionalNote: "Outpatient imaging and urgent care options are usually strong alternatives to ER-based workups.",
    insurers: ["Blue Cross Blue Shield of Texas", "UnitedHealthcare", "Aetna", "Oscar"],
    plans: [
      ...standardPublicPlans("Austin, Texas"),
      ...standardCommercialPlans("Austin, Texas", ["Blue Cross Blue Shield of Texas", "UnitedHealthcare", "Aetna", "Oscar"], {
        Oscar: {
          displayName: "Oscar EPO",
          networkType: "EPO",
          medicalCopayModel: {
            flatBySetting: {
              "primary-care": 8,
              telehealth: 0,
              "urgent-care": 110,
            },
          },
        },
      }),
    ],
    facilities: [
      { name: "Ascension Seton Express Care", type: "Urgent Care", settingId: "urgent-care" },
      { name: "St. David's North Austin Outpatient Center", type: "Hospital Outpatient", settingId: "hospital-outpatient" },
      { name: "Baylor Scott & White Clinic", type: "Clinic", settingId: "primary-care" },
      { name: "Austin Regional Diabetes Center", type: "Specialty Clinic", settingId: "endocrinology-clinic" },
    ],
  },
  {
    zipCode: "85001",
    zipPrefixes: ["850", "851", "852", "853"],
    locationLabel: "Phoenix, Arizona",
    regionalNote: "Commercial carrier mix and self-pay spreads can vary sharply by facility ownership model.",
    insurers: ["Blue Cross Blue Shield of Arizona", "UnitedHealthcare", "Aetna", "Cigna"],
    plans: [
      ...standardPublicPlans("Phoenix, Arizona"),
      ...standardCommercialPlans("Phoenix, Arizona", ["Blue Cross Blue Shield of Arizona", "UnitedHealthcare", "Aetna", "Cigna"]),
    ],
    facilities: [
      { name: "Banner Health Center", type: "Clinic", settingId: "primary-care" },
      { name: "HonorHealth Urgent Care", type: "Urgent Care", settingId: "urgent-care" },
      { name: "Mayo Clinic Arizona Outpatient", type: "Hospital Outpatient", settingId: "hospital-outpatient" },
      { name: "Banner Diabetes & Endocrinology", type: "Specialty Clinic", settingId: "endocrinology-clinic" },
    ],
  },
  {
    zipCode: "90001",
    zipPrefixes: ["900", "901", "902", "903", "904", "905", "906", "907", "908"],
    locationLabel: "Los Angeles, California",
    regionalNote: "Wide facility variation makes outpatient setting selection especially important for imaging-heavy episodes.",
    insurers: ["Blue Shield of California", "Kaiser Permanente", "Aetna", "UnitedHealthcare"],
    plans: [
      ...standardPublicPlans("Los Angeles, California"),
      ...standardCommercialPlans("Los Angeles, California", ["Blue Shield of California", "Kaiser Permanente", "Aetna", "UnitedHealthcare"], {
        "Kaiser Permanente": {
          displayName: "Kaiser HMO",
          networkType: "HMO",
          medicalCopayModel: {
            flatBySetting: {
              "primary-care": 10,
              specialist: 25,
              "urgent-care": 95,
            },
          },
        },
      }),
    ],
    facilities: [
      { name: "Cedars-Sinai Immediate Care", type: "Urgent Care", settingId: "urgent-care" },
      { name: "UCLA Health Outpatient Center", type: "Hospital Outpatient", settingId: "hospital-outpatient" },
      { name: "Providence Primary Care", type: "Clinic", settingId: "primary-care" },
      { name: "Cedars-Sinai Diabetes Center", type: "Specialty Clinic", settingId: "endocrinology-clinic" },
    ],
  },
  {
    zipCode: "94103",
    zipPrefixes: ["940", "941", "942", "943", "944", "945", "946", "947", "948", "949"],
    locationLabel: "San Francisco Bay Area, California",
    regionalNote: "Outpatient and hospital-affiliated pricing can diverge sharply in imaging and specialist-heavy episodes.",
    insurers: ["Blue Shield of California", "Kaiser Permanente", "Aetna", "UnitedHealthcare"],
    plans: [
      ...standardPublicPlans("San Francisco Bay Area, California"),
      ...standardCommercialPlans("San Francisco Bay Area, California", ["Blue Shield of California", "Kaiser Permanente", "Aetna", "UnitedHealthcare"], {
        "Kaiser Permanente": {
          displayName: "Kaiser HMO",
          networkType: "HMO",
          medicalCopayModel: {
            flatBySetting: {
              "primary-care": 15,
              specialist: 30,
              "urgent-care": 100,
            },
          },
        },
      }),
    ],
    facilities: [
      { name: "UCSF Outpatient Center", type: "Hospital Outpatient", settingId: "hospital-outpatient" },
      { name: "Sutter Walk-In Care", type: "Urgent Care", settingId: "urgent-care" },
      { name: "One Medical Primary Care", type: "Clinic", settingId: "primary-care" },
      { name: "UCSF Diabetes Teaching Center", type: "Specialty Clinic", settingId: "endocrinology-clinic" },
    ],
  },
];

const defaultMarket = finalizeMarket({
  zipCode: "00000",
  locationLabel: "Regional benchmark view",
  regionalNote:
    "BillPilot could not confidently map this ZIP to a seeded market, so it is showing a general benchmark scenario instead of guessing a city.",
  insurers: ["Blue Cross Blue Shield", "Aetna", "UnitedHealthcare", "Cigna"],
  plans: [...standardPublicPlans("Regional benchmark view"), ...standardCommercialPlans("Regional benchmark view", ["Blue Cross Blue Shield", "Aetna", "UnitedHealthcare", "Cigna"])],
  facilities: [
    { name: "Regional Hospital Outpatient Center", type: "Hospital Outpatient", settingId: "hospital-outpatient" },
    { name: "Regional Urgent Care", type: "Urgent Care", settingId: "urgent-care" },
    { name: "Independent Primary Care Clinic", type: "Clinic", settingId: "primary-care" },
    { name: "Regional Specialty Clinic", type: "Specialty Clinic", settingId: "specialist" },
  ],
});

export function enrichLocalMarketContext(
  market: Omit<LocalMarketContext, "insurancePlans" | "plans"> & {
    insurancePlans?: string[];
    plans?: LocalMarketPlan[];
  },
): LocalMarketContext {
  const plans =
    market.plans && market.plans.length > 0
      ? market.plans
      : [...standardPublicPlans(market.locationLabel), ...standardCommercialPlans(market.locationLabel, market.insurers)];

  return finalizeMarket({
    ...market,
    plans,
    insurancePlans: market.insurancePlans,
  });
}

function buildNationalFallbackMarket(zipCode: string): LocalMarketContext {
  const prefix = zipCode.slice(0, 3);
  const metro = metroFallbacks.find((item) => item.prefixes.includes(prefix));
  const state = metro?.state ?? resolveStateFromPrefix(prefix) ?? "United States";
  const locationLabel = metro?.label ?? `${state} regional market`;
  const insurers = metro?.insurers ?? stateFallbackInsurers[state] ?? ["Blue Cross Blue Shield", "Aetna", "UnitedHealthcare", "Cigna"];
  const regionalNote =
    metro?.note ??
    `BillPilot mapped this ZIP to a ${state} market profile so plan names, Medicaid labeling, and site-of-care examples stay regionally coherent even without a seeded city bundle.`;

  return enrichLocalMarketContext({
    zipCode,
    locationLabel,
    regionalNote,
    insurers,
    facilities: [
      { name: `${locationLabel} Specialty Clinic`, type: "Specialty Clinic", settingId: "endocrinology-clinic" },
      { name: `${locationLabel} Primary Care`, type: "Clinic", settingId: "primary-care" },
      { name: `${locationLabel} Outpatient Center`, type: "Hospital Outpatient", settingId: "hospital-outpatient" },
      { name: `${locationLabel} Retail Pharmacy`, type: "Retail Pharmacy", settingId: "retail-pharmacy" },
      { name: `${locationLabel} Urgent Care`, type: "Urgent Care", settingId: "urgent-care" },
    ],
  });
}

export function getLocalMarketContext(zipCode?: string): LocalMarketContext | null {
  const normalized = normalizeZipCode(zipCode);
  if (!normalized) return null;
  if (!/^\d{5}$/.test(normalized)) {
    return enrichLocalMarketContext({ ...defaultMarket, zipCode: normalized });
  }

  const exact = localMarkets.find((market) => market.zipCode === normalized);
  if (exact) {
    const { zipPrefixes: _zipPrefixes, ...rest } = exact;
    return enrichLocalMarketContext(rest);
  }

  const prefix = normalized.slice(0, 3);
  const regional = localMarkets.find((market) => market.zipPrefixes.includes(prefix));
  if (regional) {
    const { zipPrefixes: _zipPrefixes, ...rest } = regional;
    return enrichLocalMarketContext({ ...rest, zipCode: normalized });
  }

  return buildNationalFallbackMarket(normalized);
}
