"use client";

import { explorerExamples, useExplorer } from "@/hooks/use-explorer";
import { moneyDetailed } from "@/lib/format";
import { useEffect, useRef } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusMessage } from "@/components/ui/status-message";

type ExplorerPanelProps = {
  panelId: string;
  tabId: string;
};

export function ExplorerPanel({ panelId, tabId }: ExplorerPanelProps) {
  const {
    condition,
    setCondition,
    zipCode,
    setZipCode,
    result,
    status,
    loading,
    hasError,
    conditionError,
    zipError,
    analyze,
    reset,
  } = useExplorer();
  const resultsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (result) resultsRef.current?.focus();
  }, [result]);

  return (
    <section className="page" role="tabpanel" id={panelId} aria-labelledby={tabId}>
      <section className={result ? "composer composer-with-results" : "composer"}>
        <div className="composer-main">
          <h2 className="tool-title">Find treatment costs</h2>

          <div className="form-grid">
            <div>
              <label className="input-label" htmlFor="condition-input">
                Medical Condition
              </label>
              <input
                id="condition-input"
                className={conditionError ? "text-input text-input-error" : "text-input"}
                value={condition}
                onChange={(event) => setCondition(event.target.value)}
                placeholder="Try Type 1 Diabetes, UTI, or ACL MRI Pathway"
                name="condition"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(conditionError)}
                aria-describedby={conditionError ? "condition-error" : undefined}
              />
              {conditionError ? (
                <p id="condition-error" className="field-error">
                  {conditionError}
                </p>
              ) : null}
            </div>
            <div>
              <label className="input-label" htmlFor="zip-input">
                ZIP Code (optional, for regional context)
              </label>
              <input
                id="zip-input"
                className={zipError ? "text-input text-input-error" : "text-input"}
                type="text"
                name="zipCode"
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={10}
                value={zipCode}
                onChange={(event) => setZipCode(event.target.value)}
                placeholder="60601…"
                aria-invalid={Boolean(zipError)}
                aria-describedby={zipError ? "zip-error" : undefined}
              />
              {zipError ? (
                <p id="zip-error" className="field-error">
                  {zipError}
                </p>
              ) : null}
            </div>
          </div>

          <div className="action-row">
            <button onClick={analyze} disabled={loading} type="button">
              {loading ? "Analyzing…" : "Analyze"}
            </button>
            <button className="text-button" onClick={reset} type="button">
              Reset
            </button>
            <span className="inline-note">or try:</span>
            <div className="chip-row">
              {explorerExamples.map((example) => (
                <button key={example} className="link-chip" onClick={() => setCondition(example)} type="button">
                  {example}
                </button>
              ))}
            </div>
          </div>

          <StatusMessage text={status} isError={hasError} />
          <p className="support-note">
            Costs are benchmarked from CMS anchor rates plus modeled regional plan scenarios. Verify coverage and quotes with
            your provider or insurer before scheduling care.
          </p>
        </div>

        {result ? (
          <div className="composer-side">
            {result.localContext ? (
              <div className="market-card">
                <span className="market-card-tag">ZIP {result.localContext.zipCode}</span>
                <h3>{result.localContext.locationLabel}</h3>
                <p>{result.localContext.regionalNote}</p>
                <div className="mini-list">
                  <div>
                    <span className="mini-label">Likely carriers</span>
                    <p>{result.localContext.insurers.join(" · ")}</p>
                  </div>
                  <div>
                    <span className="mini-label">Nearby examples</span>
                    <p>{result.localContext.facilities.map((item) => item.name).join(" · ")}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {result ? (
        <section className="results-shell" ref={resultsRef} tabIndex={-1}>
          <div className="results-main">
            <section className="feature-card feature-card-highlight">
              <div className="feature-card-head">
                <div>
                  <p className="section-label">Recommended path</p>
                  <h3>Optimal Choice</h3>
                </div>
                {result.supported ? (
                  <div className="chip-row">
                    <span className="soft-pill">CMS benchmark</span>
                    <span className="soft-pill">Modeled patient estimate</span>
                  </div>
                ) : null}
              </div>

              {result.supported && result.recommendation ? (
                <>
                  <p className="feature-copy">{result.summary}</p>
                  <div className="stat-row">
                    <StatCard label="Best setting" value={result.recommendation.optimalSetting} />
                    <StatCard label="Best plan" value={result.recommendation.optimalPlan} />
                    <StatCard label="Savings vs costly path" value={moneyDetailed(result.recommendation.savingsVsWorstCase)} />
                  </div>
                  <p className="feature-copy">{result.recommendation.reasoning}</p>
                  <ul className="detail-list">
                    {result.recommendation.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p className="feature-copy">{result.summary}</p>
                  <div className="chip-row">
                    {result.suggestedConditions?.map((name) => (
                      <button key={name} className="link-chip" onClick={() => setCondition(name)} type="button">
                        {name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>

            {result.supported ? (
              <section className="feature-card">
                <div className="feature-card-head">
                  <div>
                    <p className="section-label">Cost comparison</p>
                    <h3>Setting × Insurance Plan</h3>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Setting</th>
                        {result.treatmentSettings[0]?.plans.map((plan) => (
                          <th key={plan.name} scope="col">
                            {plan.name}
                          </th>
                        ))}
                        <th scope="col">Medicare Base</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.treatmentSettings.map((setting) => (
                        <tr
                          key={setting.setting}
                          className={setting.setting === result.recommendation?.optimalSetting ? "recommend-row" : undefined}
                        >
                          <th scope="row">
                            <strong>{setting.setting}</strong>
                            <div className="table-note">{setting.description}</div>
                          </th>
                          {setting.plans.map((plan) => (
                            <td
                              key={plan.name}
                              className={
                                setting.setting === result.recommendation?.optimalSetting &&
                                plan.name === result.recommendation?.optimalPlan
                                  ? "recommend-cell"
                                  : undefined
                              }
                            >
                              {plan.patientPays == null ? "N/A" : moneyDetailed(plan.patientPays)}
                            </td>
                          ))}
                          <td>{moneyDetailed(setting.baseMedicareRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="table-note table-note-strong">
                  Patient-cost columns are modeled estimates by plan design. The final column is the CMS benchmark anchor.
                </p>
              </section>
            ) : null}

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
                      <th scope="col">CPT Code</th>
                      <th scope="col">Description</th>
                      <th scope="col">Category</th>
                      <th scope="col">Medicare Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.cptCodes.map((code) => (
                      <tr key={code.code}>
                        <th scope="row">{code.code}</th>
                        <td>{code.description}</td>
                        <td>{code.category}</td>
                        <td>{moneyDetailed(code.medicareRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="stack-list disclosure-stack">
                {result.methodology.map((line) => (
                  <div key={line} className="stack-item">
                    <span>{line}</span>
                  </div>
                ))}
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
              {result.localContext ? (
                <div className="stack-list">
                  <div className="stack-item">
                    <strong>{result.localContext.locationLabel}</strong>
                    <span>{result.localContext.regionalNote}</span>
                  </div>
                  <div className="stack-item">
                    <strong>Plan set</strong>
                    <span>{result.localContext.insurancePlans.join(" · ")}</span>
                  </div>
                </div>
              ) : (
                <p className="feature-copy">Add a ZIP code to localize facility names, plan defaults, and market framing.</p>
              )}
            </section>

            {result.supported && result.localContext ? (
              <section className="feature-card">
                <div className="feature-card-head">
                  <div>
                    <p className="section-label">Nearby care examples</p>
                    <h3>Local places this path maps to</h3>
                  </div>
                </div>
                <div className="stack-list">
                  {result.localContext.facilities.map((facility) => (
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
  );
}
