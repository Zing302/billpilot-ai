"use client";

import { cleanBillText, seededBillText } from "@/data/demo-fixtures";
import type {
  BillAnalysisResult,
  BillParseResult,
  DisputeDraftResult,
  TreatmentExplorerResult,
} from "@/lib/schemas/billpilot";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type Flow = "explorer" | "bill";

const explorerExamples = ["UTI", "Knee Pain Workup", "Type 2 Diabetes Follow-up", "ACL MRI Pathway"];

export function BillPilotApp() {
  const explorerTabId = useId();
  const billTabId = useId();
  const explorerPanelId = useId();
  const billPanelId = useId();
  const explorerResultsRef = useRef<HTMLElement | null>(null);
  const billResultsRef = useRef<HTMLElement | null>(null);
  const [flow, setFlow] = useState<Flow>("explorer");

  const [billText, setBillText] = useState(seededBillText);
  const [parseResult, setParseResult] = useState<BillParseResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<BillAnalysisResult | null>(null);
  const [drafts, setDrafts] = useState<DisputeDraftResult | null>(null);
  const [billStatus, setBillStatus] = useState("Paste an itemized bill or load a sample to begin.");
  const [billLoading, setBillLoading] = useState(false);

  const [condition, setCondition] = useState("UTI");
  const [zipCode, setZipCode] = useState("60601");
  const [explorerResult, setExplorerResult] = useState<TreatmentExplorerResult | null>(null);
  const [explorerStatus, setExplorerStatus] = useState(
    "Start with a supported condition and ZIP code to map the lowest-friction local care path.",
  );
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState<"provider" | "insurer" | null>(null);

  const trimmedCondition = condition.trim();
  const normalizedZip = zipCode.replace(/[^\d]/g, "");
  const explorerConditionError = trimmedCondition ? null : "Enter a medical condition to benchmark.";
  const explorerZipError =
    zipCode.trim().length > 0 && !(normalizedZip.length === 5 || normalizedZip.length === 9)
      ? "Enter a 5-digit ZIP or ZIP+4."
      : null;
  const billInputError = billText.trim() ? null : "Paste an itemized bill or load one of the examples first.";

  const billSteps = useMemo(
    () => [
      { label: "Paste", active: true, onSelect: () => resetBillWorkflow() },
      { label: "Review", active: Boolean(parseResult), onSelect: () => clearBillToReview() },
      { label: "Analyze", active: Boolean(analysisResult), onSelect: () => clearBillToAnalysis() },
      { label: "Draft", active: Boolean(drafts), onSelect: () => undefined },
    ],
    [analysisResult, drafts, parseResult],
  );

  useEffect(() => {
    if (flow === "explorer" && explorerResult) {
      explorerResultsRef.current?.focus();
    }
  }, [explorerResult, flow]);

  useEffect(() => {
    if (flow === "bill" && (parseResult || analysisResult || drafts)) {
      billResultsRef.current?.focus();
    }
  }, [analysisResult, drafts, flow, parseResult]);

  useEffect(() => {
    if (!copiedDraft) return;
    const timeout = window.setTimeout(() => setCopiedDraft(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [copiedDraft]);

  function clearBillToReview() {
    setAnalysisResult(null);
    setDrafts(null);
    setBillStatus("Review the extracted lines, then run the benchmark check.");
  }

  function clearBillToAnalysis() {
    setDrafts(null);
    if (analysisResult) {
      setBillStatus("Review the strongest findings, then generate the outreach drafts.");
    }
  }

  function resetBillWorkflow() {
    setParseResult(null);
    setAnalysisResult(null);
    setDrafts(null);
    setBillStatus("Paste an itemized bill or load a sample to begin.");
  }

  function resetExplorerWorkflow() {
    setExplorerResult(null);
    setExplorerStatus("Start with a supported condition and ZIP code to map the lowest-friction local care path.");
  }

  async function parseBill() {
    if (billInputError) {
      setBillStatus(billInputError);
      return;
    }
    setBillLoading(true);
    setBillStatus("Parsing and cleaning the bill...");
    try {
      const response = await fetch("/api/parse-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: billText }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Bill parse failed.");
      setParseResult(payload);
      setAnalysisResult(null);
      setDrafts(null);
      setBillStatus("Review the extracted lines, then run the benchmark check.");
    } catch (error) {
      setBillStatus(error instanceof Error ? error.message : "Bill parse failed.");
    } finally {
      setBillLoading(false);
    }
  }

  async function analyzeBill() {
    if (!parseResult) return;
    setBillLoading(true);
    setBillStatus("Checking for duplicates, benchmark variance, and facility-fee issues...");
    try {
      const response = await fetch("/api/analyze-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineItems: parseResult.lineItems, statedTotal: parseResult.totals.statedTotal }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Analysis failed.");
      setAnalysisResult(payload);
      setDrafts(null);
      setBillStatus("Review the strongest findings, then generate the outreach drafts.");
    } catch (error) {
      setBillStatus(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setBillLoading(false);
    }
  }

  async function generateDrafts() {
    if (!parseResult || !analysisResult) return;
    setBillLoading(true);
    setBillStatus("Writing provider and insurer drafts...");
    try {
      const response = await fetch("/api/generate-dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findings: analysisResult.findings, lineItems: parseResult.lineItems }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Draft generation failed.");
      setDrafts(payload);
      setBillStatus("Drafts are ready to copy.");
    } catch (error) {
      setBillStatus(error instanceof Error ? error.message : "Draft generation failed.");
    } finally {
      setBillLoading(false);
    }
  }

  async function analyzeTreatment() {
    if (explorerConditionError) {
      setExplorerStatus(explorerConditionError);
      return;
    }
    if (explorerZipError) {
      setExplorerStatus(explorerZipError);
      return;
    }
    setExplorerLoading(true);
    setExplorerStatus("Building the local market view...");
    try {
      const response = await fetch("/api/treatment-explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition, zipCode }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Treatment analysis failed.");
      setExplorerResult(payload);
      setExplorerStatus(
        payload.supported
          ? `Local benchmark ready for ${payload.condition}.`
          : "That condition is outside the current launch set, but you can switch to a supported example instantly.",
      );
    } catch (error) {
      setExplorerStatus(error instanceof Error ? error.message : "Treatment analysis failed.");
    } finally {
      setExplorerLoading(false);
    }
  }

  return (
    <main className="shell">
      <div className="ambient ambient-gold" aria-hidden="true" />
      <div className="ambient ambient-teal" aria-hidden="true" />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">BillPilot AI</p>
          <h1>Make the cost path feel obvious.</h1>
          <p className="hero-text">
            Use BillPilot before care to compare a smarter local starting point, or after care to review a suspicious
            bill and draft the follow-up.
          </p>
        </div>

        <div className="hero-panel">
          <span className="hero-panel-label">Two focused workflows</span>
          <div className="hero-panel-grid">
            <div>
              <strong>Before care</strong>
              <p>Condition, ZIP code, local market view, and the lowest-friction place to start.</p>
            </div>
            <div>
              <strong>After care</strong>
              <p>Bill intake, charge review, flagged findings, and copy-ready outreach drafts.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flow-toggle" aria-label="BillPilot workflows" role="tablist">
        <button
          id={explorerTabId}
          role="tab"
          aria-selected={flow === "explorer"}
          aria-controls={explorerPanelId}
          className={flow === "explorer" ? "toggle-pill toggle-pill-active" : "toggle-pill"}
          onClick={() => setFlow("explorer")}
        >
          Plan care
        </button>
        <button
          id={billTabId}
          role="tab"
          aria-selected={flow === "bill"}
          aria-controls={billPanelId}
          className={flow === "bill" ? "toggle-pill toggle-pill-active" : "toggle-pill"}
          onClick={() => setFlow("bill")}
        >
          Review bill
        </button>
      </section>

      {flow === "explorer" ? (
        <section className="page" role="tabpanel" id={explorerPanelId} aria-labelledby={explorerTabId}>
          <section className="composer composer-explorer">
            <div className="composer-main">
              <p className="section-label">Before care</p>
              <h2>Find Treatment Costs</h2>
              <p className="section-copy">
                Enter a condition. BillPilot maps the likely CPT billing codes, benchmarks CMS pricing, and compares
                costs across settings and insurance plans.
              </p>

              <div className="form-grid">
                <div>
                  <label className="input-label" htmlFor="condition-input">
                    Medical Condition
                  </label>
                  <input
                    id="condition-input"
                    className={explorerConditionError ? "text-input text-input-error" : "text-input"}
                    value={condition}
                    onChange={(event) => setCondition(event.target.value)}
                    placeholder="Try Type 1 Diabetes, UTI, or ACL MRI Pathway"
                    aria-invalid={Boolean(explorerConditionError)}
                    aria-describedby={explorerConditionError ? "condition-error" : undefined}
                  />
                  {explorerConditionError ? (
                    <p id="condition-error" className="field-error">
                      {explorerConditionError}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="input-label" htmlFor="zip-input">
                    ZIP Code (optional, for regional context)
                  </label>
                  <input
                    id="zip-input"
                    className={explorerZipError ? "text-input text-input-error" : "text-input"}
                    inputMode="numeric"
                    maxLength={10}
                    value={zipCode}
                    onChange={(event) => setZipCode(formatZipInput(event.target.value))}
                    placeholder="60601"
                    aria-invalid={Boolean(explorerZipError)}
                    aria-describedby={explorerZipError ? "zip-error" : undefined}
                  />
                  {explorerZipError ? (
                    <p id="zip-error" className="field-error">
                      {explorerZipError}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="action-row">
                <button onClick={analyzeTreatment} disabled={explorerLoading}>
                  {explorerLoading ? "Analyzing..." : "Analyze Treatment Costs"}
                </button>
                <button className="secondary-button" onClick={resetExplorerWorkflow} type="button">
                  Reset
                </button>
              </div>

              <div className="chip-row">
                {explorerExamples.map((example) => (
                  <button key={example} className="chip-button" onClick={() => setCondition(example)}>
                    {example}
                  </button>
                ))}
              </div>

              <p className="status" role="status" aria-live="polite">
                {explorerStatus}
              </p>
            </div>

            <div className="composer-side">
              {explorerResult?.localContext ? (
                <div className="market-card">
                  <span className="market-card-tag">ZIP {explorerResult.localContext.zipCode}</span>
                  <h3>{explorerResult.localContext.locationLabel}</h3>
                  <p>{explorerResult.localContext.regionalNote}</p>
                  <div className="mini-list">
                    <div>
                      <span className="mini-label">Likely carriers</span>
                      <p>{explorerResult.localContext.insurers.join(" · ")}</p>
                    </div>
                    <div>
                      <span className="mini-label">Nearby examples</span>
                      <p>{explorerResult.localContext.facilities.map((item) => item.name).join(" · ")}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="placeholder-card">
                  <span className="mini-label">Local market preview</span>
                  <p>Enter a ZIP code to unlock the nearby clinics, hospitals, and payer defaults tied to the local market.</p>
                </div>
              )}
            </div>
          </section>

          {explorerResult ? (
            <section className="results-shell" ref={explorerResultsRef} tabIndex={-1}>
              <div className="results-main">
                <section className="feature-card feature-card-highlight">
                  <div className="feature-card-head">
                    <div>
                      <p className="section-label">Recommended path</p>
                      <h3>Optimal Choice</h3>
                    </div>
                    {explorerResult.supported ? (
                      <div className="chip-row">
                        <span className="soft-pill">CMS benchmark</span>
                        <span className="soft-pill">Modeled patient estimate</span>
                      </div>
                    ) : null}
                  </div>

                  {explorerResult.supported && explorerResult.recommendation ? (
                    <>
                      <p className="feature-copy">{explorerResult.summary}</p>
                      <div className="stat-row">
                        <StatCard label="Best setting" value={explorerResult.recommendation.optimalSetting} />
                        <StatCard label="Best plan" value={explorerResult.recommendation.optimalPlan} />
                        <StatCard
                          label="Savings vs costly path"
                          value={moneyDetailed(explorerResult.recommendation.savingsVsWorstCase)}
                        />
                      </div>
                      <p className="feature-copy">{explorerResult.recommendation.reasoning}</p>
                      <ul className="detail-list">
                        {explorerResult.recommendation.tips.map((tip) => (
                          <li key={tip}>{tip}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="feature-copy">{explorerResult.summary}</p>
                      <div className="chip-row">
                        {explorerResult.suggestedConditions?.map((name) => (
                          <span key={name} className="soft-pill">
                            {name}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                {explorerResult.supported ? (
                  <section className="feature-card">
                    <div className="feature-card-head">
                      <div>
                        <p className="section-label">Cost Comparison</p>
                        <h3>Setting × Insurance Plan</h3>
                      </div>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Setting</th>
                            {explorerResult.treatmentSettings[0]?.plans.map((plan) => (
                              <th key={plan.name}>{plan.name}</th>
                            ))}
                            <th>Medicare Base</th>
                          </tr>
                        </thead>
                        <tbody>
                          {explorerResult.treatmentSettings.map((setting) => {
                            return (
                              <tr
                                key={setting.setting}
                                className={
                                  setting.setting === explorerResult.recommendation?.optimalSetting
                                    ? "recommend-row"
                                    : undefined
                                }
                              >
                                <td>
                                  <strong>{setting.setting}</strong>
                                  <div className="table-note">{setting.description}</div>
                                </td>
                                {setting.plans.map((plan) => (
                                  <td
                                    key={plan.name}
                                    className={
                                      setting.setting === explorerResult.recommendation?.optimalSetting &&
                                      plan.name === explorerResult.recommendation?.optimalPlan
                                        ? "recommend-cell"
                                        : undefined
                                    }
                                  >
                                    {plan.patientPays == null ? "N/A" : moneyDetailed(plan.patientPays)}
                                  </td>
                                ))}
                                <td>{moneyDetailed(setting.baseMedicareRate)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="table-note table-note-strong">
                      Patient-cost columns are modeled estimates by plan design. The final column is the CMS benchmark anchor.
                    </p>
                  </section>
                ) : null}

                <section className="feature-card">
                  <div className="feature-card-head">
                    <div>
                      <p className="section-label">How It Works</p>
                      <h3>How BillPilot benchmarks the episode</h3>
                    </div>
                  </div>
                  <div className="stack-list">
                    {explorerResult.methodology.map((line) => (
                      <div key={line} className="stack-item">
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <details className="feature-card disclosure-card">
                  <summary className="disclosure-summary">
                    <div>
                      <p className="section-label">Identified billing codes</p>
                      <h3>CPT codes BillPilot matched to this condition</h3>
                    </div>
                    <span className="soft-pill">Expand details</span>
                  </summary>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>CPT Code</th>
                          <th>Description</th>
                          <th>Category</th>
                          <th>Medicare Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {explorerResult.cptCodes.map((code) => (
                          <tr key={code.code}>
                            <td>
                              <strong>{code.code}</strong>
                            </td>
                            <td>{code.description}</td>
                            <td>{code.category}</td>
                            <td>{moneyDetailed(code.medicareRate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>

              <aside className="results-side">
                <section className="feature-card">
                  <div className="feature-card-head">
                    <div>
                      <p className="section-label">Local market</p>
                      <h3>What the ZIP code changed</h3>
                    </div>
                  </div>
                  {explorerResult.localContext ? (
                    <div className="stack-list">
                      <div className="stack-item">
                        <strong>{explorerResult.localContext.locationLabel}</strong>
                        <span>{explorerResult.localContext.regionalNote}</span>
                      </div>
                      <div className="stack-item">
                        <strong>Plan set</strong>
                        <span>{explorerResult.localContext.insurancePlans.join(" · ")}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="feature-copy">Add a ZIP code to localize facility names, plan defaults, and market framing.</p>
                  )}
                </section>

                {explorerResult.supported && explorerResult.localContext ? (
                  <section className="feature-card">
                    <div className="feature-card-head">
                      <div>
                        <p className="section-label">Nearby care examples</p>
                        <h3>Local places this path maps to</h3>
                      </div>
                    </div>
                    <div className="stack-list">
                      {explorerResult.localContext.facilities.map((facility) => (
                        <div key={facility.name} className="stack-item">
                          <strong>{facility.name}</strong>
                          <span>{facility.type}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </aside>
            </section>
          ) : null}
        </section>
      ) : (
        <section className="page" role="tabpanel" id={billPanelId} aria-labelledby={billTabId}>
          <section className="composer composer-bill">
            <div className="composer-main">
              <p className="section-label">After care</p>
              <h2>Audit a bill without getting buried in it</h2>
              <p className="section-copy">
                Paste the itemized bill, review the extracted lines, then move through the flagged findings and the
                ready-to-send drafts in a clean sequence.
              </p>

              <div className="action-row">
                <button className="chip-button" onClick={() => setBillText(seededBillText)}>
                  Load flagged example
                </button>
                <button className="chip-button" onClick={() => setBillText(cleanBillText)}>
                  Load clean example
                </button>
              </div>

              <textarea
                className={billInputError ? "bill-input text-input-error" : "bill-input"}
                value={billText}
                onChange={(event) => setBillText(event.target.value)}
                placeholder="Paste itemized bill text here..."
                aria-invalid={Boolean(billInputError)}
                aria-describedby={billInputError ? "bill-error" : undefined}
              />
              {billInputError ? (
                <p id="bill-error" className="field-error">
                  {billInputError}
                </p>
              ) : null}

              <div className="action-row">
                <button onClick={parseBill} disabled={billLoading}>
                  {billLoading ? "Working..." : "Parse bill"}
                </button>
                <button className="secondary-button" onClick={analyzeBill} disabled={!parseResult || billLoading}>
                  Find issues
                </button>
                <button className="secondary-button" onClick={generateDrafts} disabled={!analysisResult || billLoading}>
                  Create drafts
                </button>
                <button className="secondary-button" onClick={resetBillWorkflow} type="button">
                  Reset
                </button>
              </div>

              <p className="status" role="status" aria-live="polite">
                {billStatus}
              </p>
            </div>

            <div className="composer-side">
              <div className="step-card">
                <span className="mini-label">Workflow</span>
                <div className="step-row">
                  {billSteps.map((step) => (
                    <button
                      key={step.label}
                      type="button"
                      className={step.active ? "soft-pill soft-pill-active step-pill-button" : "soft-pill step-pill-button"}
                      onClick={step.onSelect}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {parseResult || analysisResult || drafts ? (
            <section className="results-shell" ref={billResultsRef} tabIndex={-1}>
              <div className="results-main">
                {parseResult ? (
                  <section className="feature-card">
                    <div className="feature-card-head">
                      <div>
                        <p className="section-label">Extracted lines</p>
                        <h3>Review what BillPilot found</h3>
                      </div>
                      <span className="soft-pill">
                        Parser confidence {Math.round(parseResult.extractionConfidence * 100)}%
                      </span>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Charge</th>
                            <th>Billed</th>
                            <th>Allowed</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseResult.lineItems.map((item) => (
                            <tr key={item.id}>
                              <td>{item.description}</td>
                              <td>{money(item.billedAmount)}</td>
                              <td>{item.allowedAmount == null ? "Missing" : money(item.allowedAmount)}</td>
                              <td>{item.serviceDate ?? "Missing"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parseResult.uncertainFields.length ? (
                      <div className="stack-list">
                      {parseResult.uncertainFields.map((field) => (
                        <div key={`${field.lineItemId}-${field.field}`} className="stack-item">
                          <strong>{field.field}</strong>
                          <span>{field.reason}</span>
                        </div>
                        ))}
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {analysisResult ? (
                  <section className="feature-card">
                    <div className="feature-card-head">
                      <div>
                        <p className="section-label">Flagged issues</p>
                        <h3>What needs attention</h3>
                      </div>
                    </div>
                    <div className="finding-grid">
                      {analysisResult.findings.map((finding) => (
                        <article key={finding.id} className="finding-card">
                          <div className="finding-meta">
                            <span className={`severity severity-${finding.severity}`}>{finding.severity}</span>
                            <span className="finding-type">{finding.type.replace(/_/g, " ")}</span>
                          </div>
                          <h4>{finding.headline}</h4>
                          <p>{finding.explanation}</p>
                          <ul className="detail-list">
                            {finding.evidence.map((evidence) => (
                              <li key={evidence}>{evidence}</li>
                            ))}
                          </ul>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>

              <aside className="results-side">
                <section className="feature-card feature-card-highlight">
                  <div className="feature-card-head">
                    <div>
                      <p className="section-label">Quick read</p>
                      <h3>What the review says</h3>
                    </div>
                  </div>
                  <div className="stat-row">
                    <StatCard label="Billed total" value={money(parseResult?.totals.billedTotal ?? 0)} />
                    <StatCard
                      label="Allowed benchmark"
                      value={money(analysisResult?.totals.allowedTotal ?? parseResult?.totals.allowedTotal ?? 0)}
                    />
                    <StatCard label="Review opportunity" value={money(analysisResult?.estimatedOpportunity ?? 0)} />
                  </div>
                </section>

                {drafts ? (
                  <section className="feature-card">
                    <div className="feature-card-head">
                      <div>
                        <p className="section-label">Outreach drafts</p>
                        <h3>Copy and send</h3>
                      </div>
                    </div>
                    <div className="draft-grid">
                      <DraftBlock
                        title="Provider draft"
                        text={drafts.providerDraft}
                        copied={copiedDraft === "provider"}
                        onCopy={async () => {
                          await navigator.clipboard.writeText(drafts.providerDraft);
                          setCopiedDraft("provider");
                        }}
                      />
                      <DraftBlock
                        title="Insurer draft"
                        text={drafts.insurerDraft}
                        copied={copiedDraft === "insurer"}
                        onCopy={async () => {
                          await navigator.clipboard.writeText(drafts.insurerDraft);
                          setCopiedDraft("insurer");
                        }}
                      />
                    </div>
                  </section>
                ) : null}
              </aside>
            </section>
          ) : null}
        </section>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DraftBlock({
  title,
  text,
  copied,
  onCopy,
}: {
  title: string;
  text: string;
  copied: boolean;
  onCopy: () => Promise<void>;
}) {
  return (
    <div className="draft-block">
      <div className="draft-block-head">
        <h4>{title}</h4>
        <button className="secondary-button copy-button" onClick={onCopy} type="button">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea readOnly value={text} />
    </div>
  );
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function moneyDetailed(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatZipInput(value: string): string {
  const digits = value.replace(/[^\d]/g, "").slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
