// ─── Shared utility ────────────────────────────────────────────────────────────
function money(value) {
  if (value == null) return "N/A";
  return `$${Number(value).toFixed(2)}`;
}

// ─── Tab switching ──────────────────────────────────────────────────────────────
const tabs = document.querySelectorAll(".tab");
const paneBill = document.getElementById("pane-bill");
const paneExplorer = document.getElementById("pane-explorer");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("tab-active"));
    tab.classList.add("tab-active");
    if (tab.dataset.tab === "bill") {
      paneBill.classList.remove("hidden");
      paneExplorer.classList.add("hidden");
    } else {
      paneBill.classList.add("hidden");
      paneExplorer.classList.remove("hidden");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BILL DISPUTE
// ═══════════════════════════════════════════════════════════════════════════════

const sampleData = `Comprehensive Metabolic Panel|420.00|180.00|2026-02-10
Emergency Room Facility Fee|2150.00|980.00|2026-02-10
IV Hydration Service|690.00|240.00|2026-02-10
Physician Evaluation Level 4|860.00|430.00|2026-02-10
Duplicate Lab Processing Charge|310.00|120.00|2026-02-10`;

const billFile = document.getElementById("billFile");
const loadSampleBtn = document.getElementById("loadSampleBtn");
const rawInput = document.getElementById("rawInput");
const parseBtn = document.getElementById("parseBtn");
const parseStatus = document.getElementById("parseStatus");
const lineItemsBody = document.getElementById("lineItemsBody");
const planEl = document.getElementById("plan");
const callScript = document.getElementById("callScript");
const emailDraft = document.getElementById("emailDraft");
const copyCall = document.getElementById("copyCall");
const copyEmail = document.getElementById("copyEmail");

let currentItems = [];

function parseLine(line) {
  const [description, billedRaw, allowedRaw, billedDate] = line.split("|").map((chunk) => chunk.trim());
  if (!description || !billedRaw || !allowedRaw || !billedDate) return null;

  const billed = Number.parseFloat(billedRaw);
  const allowed = Number.parseFloat(allowedRaw);
  if (Number.isNaN(billed) || Number.isNaN(allowed)) return null;

  const variance = billed - allowed;
  const ratio = billed > 0 ? variance / billed : 0;

  let risk = "Low";
  if (description.toLowerCase().includes("duplicate") || ratio > 0.6) risk = "High";
  else if (ratio > 0.35) risk = "Medium";

  return { description, billed, allowed, variance, risk, billedDate };
}

function parseInput(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseLine)
    .filter(Boolean);
}

function renderTable(items) {
  lineItemsBody.innerHTML = "";
  for (const item of items) {
    const tr = document.createElement("tr");
    const riskClass = item.risk === "High" ? "risk-high" : item.risk === "Medium" ? "risk-med" : "risk-low";
    tr.innerHTML = `
      <td>${item.description}</td>
      <td>${money(item.billed)}</td>
      <td>${money(item.allowed)}</td>
      <td>${money(item.variance)}</td>
      <td class="${riskClass}">${item.risk}</td>
    `;
    lineItemsBody.appendChild(tr);
  }
}

function renderPlan(items) {
  const totalBilled = items.reduce((sum, item) => sum + item.billed, 0);
  const totalAllowed = items.reduce((sum, item) => sum + item.allowed, 0);
  const savingsEstimate = Math.max(totalBilled - totalAllowed, 0);
  const highRisk = items.filter((item) => item.risk === "High");
  const highRiskNames = highRisk.map((item) => item.description).slice(0, 3).join(", ") || "none";

  planEl.innerHTML = `
    <div class="plan-item"><strong>Step 1:</strong> Ask provider billing office to justify these high-risk items: ${highRiskNames}.</div>
    <div class="plan-item"><strong>Step 2:</strong> Request corrected claim review against allowed amounts and coding documentation.</div>
    <div class="plan-item"><strong>Step 3:</strong> Escalate to insurer with itemized dispute packet and callback timeline.</div>
    <div class="plan-item"><strong>Estimated Savings Opportunity:</strong> ${money(savingsEstimate)} on this bill.</div>
  `;

  callScript.value = `Hi, I am calling about bill date ${items[0]?.billedDate || "N/A"}.\n\nI reviewed the itemized charges and identified potential overbilling compared with allowed amounts.\nThe highest concern items are: ${highRiskNames}.\n\nPlease open a billing review ticket, provide CPT/code-level justification, and issue a corrected statement if errors are confirmed.\nCan you give me the case ID and expected resolution date today?`;

  emailDraft.value = `Drafting AI-powered customized dispute email...\nPlease wait a few seconds.`;
}

async function runPipeline() {
  const raw = rawInput.value.trim();
  const items = parseInput(raw);
  if (!items.length) {
    parseStatus.textContent = "No valid lines found. Use format: Description|Amount|Allowed|Date";
    parseStatus.style.color = "#a62424";
    lineItemsBody.innerHTML = "";
    planEl.innerHTML = "";
    callScript.value = "";
    emailDraft.value = "";
    return;
  }

  currentItems = items;
  renderTable(items);
  renderPlan(items);
  parseStatus.textContent = `Parsed ${items.length} line items. Generating AI dispute email...`;
  parseStatus.style.color = "#4a5f67";
  
  parseBtn.disabled = true;

  try {
    const res = await fetch("/api/generate-dispute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineItems: items })
    });
    if (!res.ok) throw new Error("Failed to generate email");
    const data = await res.json();
    emailDraft.value = data.emailDraft;
    parseStatus.textContent = `Parsed ${items.length} line items. Anomaly detection and AI email generation complete.`;
    parseStatus.style.color = "#136948";
  } catch (err) {
    parseStatus.textContent = `Parsed ${items.length} line items. (AI email failed: ${err.message})`;
    parseStatus.style.color = "#a62424";
  } finally {
    parseBtn.disabled = false;
  }
}

billFile.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  rawInput.value = text;
  parseStatus.textContent = `Loaded ${file.name}. Click Parse Bill.`;
  parseStatus.style.color = "#4a5f67";
});

loadSampleBtn.addEventListener("click", () => {
  rawInput.value = sampleData;
  parseStatus.textContent = "Sample bill loaded. Click Parse Bill.";
  parseStatus.style.color = "#4a5f67";
});

parseBtn.addEventListener("click", runPipeline);

async function copyText(text, label) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    parseStatus.textContent = `${label} copied.`;
    parseStatus.style.color = "#136948";
  } catch {
    parseStatus.textContent = `Could not copy ${label.toLowerCase()}.`;
    parseStatus.style.color = "#a62424";
  }
}

copyCall.addEventListener("click", () => copyText(callScript.value, "Call script"));
copyEmail.addEventListener("click", () => copyText(emailDraft.value, "Email draft"));

// Auto-load sample for fast stage demo.
rawInput.value = sampleData;
runPipeline();

// ═══════════════════════════════════════════════════════════════════════════════
// TREATMENT COST EXPLORER
// ═══════════════════════════════════════════════════════════════════════════════

const analyzeBtn = document.getElementById("analyzeBtn");
const conditionInput = document.getElementById("conditionInput");
const zipInput = document.getElementById("zipInput");
const explorerStatus = document.getElementById("explorerStatus");
const explorerResults = document.getElementById("explorerResults");

analyzeBtn.addEventListener("click", async () => {
  const condition = conditionInput.value.trim();
  if (!condition) {
    explorerStatus.textContent = "Please enter a medical condition.";
    explorerStatus.style.color = "#a62424";
    return;
  }

  explorerStatus.textContent = "Analyzing treatment costs with AI…";
  explorerStatus.style.color = "#4a5f67";
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Analyzing…";
  explorerResults.classList.add("hidden");

  try {
    const response = await fetch("/api/treatment-explorer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ condition, zipCode: zipInput.value.trim() }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    renderExplorerResults(data);
    explorerStatus.textContent = `Analysis complete for: ${data.condition}`;
    explorerStatus.style.color = "#136948";
  } catch (err) {
    explorerStatus.textContent = `Error: ${err.message}`;
    explorerStatus.style.color = "#a62424";
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze Treatment Costs";
  }
});

// ─── Render helpers ─────────────────────────────────────────────────────────────

function renderExplorerResults(data) {
  // Condition summary
  document.getElementById("conditionSummary").textContent = data.summary || "";

  // CPT codes
  renderCptCodes(data.cptCodes || []);

  // Cost matrix
  renderCostMatrix(data.treatmentSettings || [], data.recommendation);

  // Recommendation
  renderRecommendation(data.recommendation);

  explorerResults.classList.remove("hidden");
  explorerResults.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCptCodes(codes) {
  const cptBody = document.getElementById("cptBody");
  cptBody.innerHTML = "";
  for (const cpt of codes) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code class="cpt-code">${cpt.code}</code></td>
      <td>${cpt.description}</td>
      <td><span class="cpt-badge cat-${slugify(cpt.category)}">${cpt.category}</span></td>
      <td class="cpt-rate">${money(cpt.medicareRate)}</td>
    `;
    cptBody.appendChild(tr);
  }
}

function renderCostMatrix(settings, recommendation) {
  if (!settings.length) return;

  const planNames = settings[0].plans.map((p) => p.name);
  const recSetting = recommendation?.optimalSetting;
  const recPlan = recommendation?.optimalPlan;

  // Build per-column min/max for colour coding (null values excluded)
  const planMins = planNames.map((_, pi) =>
    Math.min(...settings.map((s) => s.plans[pi]?.patientPays ?? Infinity).filter((v) => v !== null))
  );
  const planMaxs = planNames.map((_, pi) =>
    Math.max(...settings.map((s) => s.plans[pi]?.patientPays ?? -Infinity).filter((v) => v !== null))
  );

  // Header
  const matrixHead = document.getElementById("matrixHead");
  matrixHead.innerHTML = `<tr>
    <th class="setting-col">Setting</th>
    ${planNames.map((n) => `<th>${n}</th>`).join("")}
    <th class="base-rate-col">Medicare Base</th>
  </tr>`;

  // Rows
  const matrixBody = document.getElementById("matrixBody");
  matrixBody.innerHTML = "";

  for (const setting of settings) {
    const isRecSetting = setting.setting === recSetting;
    const tr = document.createElement("tr");
    if (isRecSetting) tr.classList.add("rec-row");

    let cells = `<td class="setting-name">${isRecSetting ? "★ " : ""}${setting.setting}</td>`;

    setting.plans.forEach((plan, pi) => {
      const val = plan.patientPays;
      const isRec = isRecSetting && plan.name === recPlan;
      const isMin = val != null && val === planMins[pi];
      const isMax = val != null && val === planMaxs[pi];

      let cls = "matrix-cell";
      if (isRec) cls += " cell-rec";
      else if (isMin) cls += " cell-min";
      else if (isMax) cls += " cell-max";

      const display = val == null ? '<span class="na">N/A</span>' : money(val);
      cells += `<td class="${cls}" title="${plan.note}">${isRec ? "★ " : ""}${display}</td>`;
    });

    cells += `<td class="base-rate">${money(setting.baseMedicareRate)}</td>`;
    tr.innerHTML = cells;
    matrixBody.appendChild(tr);
  }
}

function renderRecommendation(rec) {
  if (!rec) return;
  const el = document.getElementById("recommendationContent");
  el.innerHTML = `
    <div class="rec-header">
      <div class="rec-badge">
        <span class="rec-label">Best Setting</span>
        <span class="rec-value">${rec.optimalSetting}</span>
      </div>
      <div class="rec-badge">
        <span class="rec-label">Best Plan</span>
        <span class="rec-value">${rec.optimalPlan}</span>
      </div>
      <div class="rec-badge rec-savings-badge">
        <span class="rec-label">Savings vs Worst Case</span>
        <span class="rec-value">${money(rec.savingsVsWorstCase)}</span>
      </div>
    </div>
    <p class="rec-reasoning">${rec.reasoning}</p>
    ${
      rec.tips?.length
        ? `<div class="rec-tips">
        <strong>Tips to maximise savings:</strong>
        <ul>${rec.tips.map((t) => `<li>${t}</li>`).join("")}</ul>
      </div>`
        : ""
    }
  `;
}

function slugify(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "-");
}
