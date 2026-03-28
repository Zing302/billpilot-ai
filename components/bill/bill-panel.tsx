"use client";

import { CopyButton } from "@/components/ui/copy-button";
import { StatCard } from "@/components/ui/stat-card";
import { StatusMessage } from "@/components/ui/status-message";
import { useBillAudit } from "@/hooks/use-bill-audit";
import { useClipboard } from "@/hooks/use-clipboard";
import { money } from "@/lib/format";
import { useEffect, useRef } from "react";

type BillPanelProps = {
  panelId: string;
  tabId: string;
};

export function BillPanel({ panelId, tabId }: BillPanelProps) {
  const {
    billText,
    setBillText,
    uploadedFile,
    parseResult,
    analysisResult,
    drafts,
    status,
    loading,
    hasError,
    inputError,
    steps,
    nextAction,
    nextActionHint,
    loadFlaggedExample,
    loadCleanExample,
    uploadBill,
    clearUploadedFile,
    reset,
  } = useBillAudit();
  const { copiedId, copy } = useClipboard();
  const resultsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (parseResult || analysisResult || drafts) resultsRef.current?.focus();
  }, [analysisResult, drafts, parseResult]);

  return (
    <section className="page" role="tabpanel" id={panelId} aria-labelledby={tabId}>
      <section className="composer">
        <div className="composer-main">
          <h2 className="tool-title">Review an itemized bill</h2>

          <div className="step-strip">
            {steps.map((step, index) => (
              <button
                key={step.label}
                type="button"
                className={step.active ? "step-link step-link-active" : "step-link"}
                onClick={step.onSelect}
              >
                <span>{index + 1}</span>
                {step.label}
              </button>
            ))}
          </div>

          <div className="action-row">
            <button className="link-chip" onClick={loadFlaggedExample} type="button">
              Load flagged example
            </button>
            <button className="link-chip" onClick={loadCleanExample} type="button">
              Load clean example
            </button>
            <label className="upload-button">
              Upload bill file
              <input
                type="file"
                name="billFile"
                aria-label="Upload a bill file"
                accept=".txt,.csv,.pdf,text/plain,text/csv,application/pdf"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  await uploadBill(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {uploadedFile ? (
              <button className="link-chip" onClick={clearUploadedFile} type="button">
                Clear file
              </button>
            ) : null}
          </div>

          {uploadedFile ? (
            <div className="upload-summary">
              <strong>{uploadedFile.fileName}</strong>
              <span>{uploadedFile.mimeType === "application/pdf" ? "PDF upload" : "Text-based upload"}</span>
            </div>
          ) : null}

          <label className="input-label" htmlFor="bill-input">
            Itemized Bill
          </label>
          <textarea
            id="bill-input"
            className={inputError ? "bill-input text-input-error" : "bill-input"}
            value={billText}
            onChange={(event) => setBillText(event.target.value)}
            placeholder="Paste itemized bill text here, or upload a TXT / CSV / PDF file above…"
            name="billText"
            autoComplete="off"
            aria-invalid={Boolean(inputError)}
            aria-describedby={inputError ? "bill-error" : undefined}
          />
          {inputError ? (
            <p id="bill-error" className="field-error">
              {inputError}
            </p>
          ) : null}

          <div className="action-row">
            {nextAction ? (
              <button onClick={nextAction.onClick} disabled={loading} type="button">
                {nextAction.label}
              </button>
            ) : null}
            <button className="text-button" onClick={reset} type="button">
              Reset
            </button>
          </div>

          <StatusMessage text={status} isError={hasError} />
        </div>
      </section>

      {parseResult || analysisResult || drafts ? (
        <section className="results-shell" ref={resultsRef} tabIndex={-1}>
          <div className="results-main">
            {parseResult ? (
              <section className="feature-card">
                <div className="feature-card-head">
                  <div>
                    <p className="section-label">Extracted lines</p>
                    <h3>Review what BillPilot found</h3>
                  </div>
                  <span className="soft-pill">Parser confidence {Math.round(parseResult.extractionConfidence * 100)}%</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Charge</th>
                        <th scope="col">Billed</th>
                        <th scope="col">Allowed</th>
                        <th scope="col">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.lineItems.map((item) => (
                        <tr key={item.id}>
                          <th scope="row">{item.description}</th>
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
                    <article key={finding.id} className={`finding-card finding-card-${finding.severity}`}>
                      <div className="finding-meta">
                        <span className={`severity severity-${finding.severity}`}>{`${finding.severity} — ${finding.type.replace(/_/g, " ")}`}</span>
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
            {nextAction ? (
              <section className="feature-card feature-card-highlight">
                <div className="feature-card-head">
                  <div>
                    <p className="section-label">Next step</p>
                    <h3>{nextAction.label}</h3>
                  </div>
                </div>
                <p className="feature-copy">{nextActionHint}</p>
                <button onClick={nextAction.onClick} disabled={loading} type="button">
                  {nextAction.label}
                </button>
              </section>
            ) : null}

            <section className="feature-card">
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
                    copied={copiedId === "provider"}
                    onCopy={() => copy("provider", drafts.providerDraft)}
                  />
                  <DraftBlock
                    title="Insurer draft"
                    text={drafts.insurerDraft}
                    copied={copiedId === "insurer"}
                    onCopy={() => copy("insurer", drafts.insurerDraft)}
                  />
                </div>
              </section>
            ) : null}
          </aside>
        </section>
      ) : null}
    </section>
  );
}

type DraftBlockProps = {
  title: string;
  text: string;
  copied: boolean;
  onCopy: () => Promise<void>;
};

function DraftBlock({ title, text, copied, onCopy }: DraftBlockProps) {
  return (
    <div className="draft-block">
      <div className="draft-block-head">
        <h4>{title}</h4>
        <CopyButton copied={copied} onCopy={onCopy} />
      </div>
      <textarea readOnly aria-label={title} value={text} />
    </div>
  );
}
