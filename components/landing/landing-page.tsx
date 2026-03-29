import Link from "next/link";

export function LandingPage() {
  return (
    <div className="landing-page">
      <div aria-hidden="true" className="bg-orb orb-a" />
      <div aria-hidden="true" className="bg-orb orb-b" />
      <div aria-hidden="true" className="bg-orb orb-c" />

      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <strong className="landing-brand">BillPilot AI</strong>
          <nav className="landing-nav-actions" aria-label="Primary">
            <Link className="landing-button landing-button-secondary landing-mobile-hidden" href="/app?tab=bill">
              Review a bill
            </Link>
            <Link className="landing-button landing-button-primary" href="/app?tab=explorer">
              Plan care costs
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">Medical billing, finally transparent</p>
              <h1 className="landing-title">
                Your medical bill is probably <span>wrong</span>.
              </h1>
              <p className="landing-subhead">
                80% of hospital bills contain errors. Most patients pay without question. BillPilot benchmarks what care
                should cost before you book and finds what you were overcharged after you get the bill.
              </p>
              <div className="landing-hero-actions">
                <Link className="landing-button landing-button-primary" href="/app?tab=bill">
                  Audit my bill →
                </Link>
                <Link className="landing-button landing-button-ghost" href="/app?tab=explorer">
                  Compare care costs
                </Link>
              </div>
              <p className="landing-trust-line">
                Built on CMS Medicare benchmark data · 31 conditions · ZIP-aware pricing
              </p>
            </div>

            <div className="landing-hero-visual" aria-hidden="true">
              <div className="hero-bill-card">
                <div className="hero-bill-header">
                  <span>MERCY GENERAL HOSPITAL</span>
                  <strong>Patient Statement — Account #48291</strong>
                </div>
                <div className="hero-bill-rule" />
                <div className="hero-bill-rows">
                  <div className="hero-bill-row">
                    <span>Comprehensive Metabolic Panel</span>
                    <strong>$420.00</strong>
                  </div>
                  <div className="hero-bill-row hero-bill-row-alert">
                    <span>Emergency Room Facility Fee</span>
                    <div className="hero-bill-amount">
                      <strong>$2,150.00</strong>
                      <span className="hero-flag hero-flag-danger">⚑ Overcharge</span>
                    </div>
                  </div>
                  <div className="hero-bill-row">
                    <span>IV Hydration Service</span>
                    <strong>$690.00</strong>
                  </div>
                  <div className="hero-bill-row">
                    <span>Physician Evaluation Level 4</span>
                    <strong>$860.00</strong>
                  </div>
                  <div className="hero-bill-row hero-bill-row-alert">
                    <span>Duplicate Lab Processing Charge</span>
                    <div className="hero-bill-amount">
                      <strong>$310.00</strong>
                      <span className="hero-flag hero-flag-danger">⚑ Duplicate</span>
                    </div>
                  </div>
                </div>
                <div className="hero-bill-rule" />
                <div className="hero-bill-total">
                  <span>TOTAL DUE</span>
                  <strong>$4,430.00</strong>
                </div>
              </div>
              <div className="hero-success-pill">✓ BillPilot found $2,360 in dispute opportunity</div>
            </div>
          </div>
        </section>

        <section className="landing-stats">
          <div className="landing-container">
            <div className="landing-stats-grid">
              <article>
                <strong>80%</strong>
                <span>of hospital bills contain at least one error</span>
              </article>
              <article>
                <strong>$3.4T</strong>
                <span>spent on US healthcare annually</span>
              </article>
              <article>
                <strong>&lt; 1%</strong>
                <span>of patients formally dispute their bills</span>
              </article>
            </div>
            <p className="landing-stats-source">
              Sources: Medical Billing Advocates of America · CMS National Health Expenditure Data
            </p>
          </div>
        </section>

        <section className="landing-workflows landing-surface-cool">
          <div className="landing-container landing-section-intro">
            <p className="landing-eyebrow">Two tools. One patient journey.</p>
            <h2>Before care and after billing.</h2>
            <p>Most tools pick one side. BillPilot covers both.</p>
          </div>

          <div className="landing-container landing-card-grid">
            <article className="workflow-card workflow-card-cool">
              <span className="workflow-badge workflow-badge-cool">Before you book</span>
              <h3>Know the price before you go.</h3>
              <p>
                Enter a condition and ZIP. BillPilot maps CPT billing codes, benchmarks CMS rates, and shows your
                out-of-pocket across settings and insurance plans.
              </p>
              <div className="workflow-table">
                <div className="workflow-table-head">
                  <span>Setting</span>
                  <span>Medicare</span>
                  <span>Blue Cross PPO</span>
                  <span>HMO</span>
                </div>
                <div className="workflow-table-row workflow-table-row-recommended">
                  <span>★ Primary Care</span>
                  <span>$108</span>
                  <span>$22</span>
                  <span>$15</span>
                </div>
                <div className="workflow-table-row">
                  <span>Urgent Care</span>
                  <span>$450</span>
                  <span>$75</span>
                  <span>$60</span>
                </div>
                <div className="workflow-table-row">
                  <span>Hospital</span>
                  <span>$890</span>
                  <span>$180</span>
                  <span>$145</span>
                </div>
              </div>
              <p className="workflow-footnote">★ Recommended path saves up to $160 vs urgent care</p>
            </article>

            <article className="workflow-card workflow-card-warm">
              <span className="workflow-badge workflow-badge-warm">After it arrives</span>
              <h3>Find what you were overcharged.</h3>
              <p>
                Paste or upload an itemized bill. BillPilot detects duplicates, benchmark variances, and facility fee
                issues — then writes your dispute letters.
              </p>
              <div className="finding-mock-list">
                <div className="finding-mock finding-mock-high">⚑ Duplicate charge · Lab Processing Fee · $310.00</div>
                <div className="finding-mock finding-mock-medium">⚠ Benchmark variance · ER Facility Fee · 55% above allowed</div>
                <div className="finding-mock finding-mock-high">⚑ Facility fee · $2,150 — warrants itemization</div>
              </div>
              <p className="workflow-success">→ Dispute letters ready to copy</p>
            </article>
          </div>
        </section>

        <section className="landing-spotlights">
          <div className="landing-container spotlight-row">
            <div className="spotlight-copy">
              <p className="landing-eyebrow">Cost benchmarking</p>
              <h3>Compare every setting. Pick the right one.</h3>
              <p>
                BillPilot maps your condition to the CPT billing codes providers use, then prices each care setting across
                six insurance plan types. ZIP code localizes the results with real facility names and carrier data.
              </p>
              <ul className="spotlight-list">
                <li>CMS Medicare rates as the pricing floor</li>
                <li>Modeled patient out-of-pocket per plan</li>
                <li>ZIP-aware local facility and carrier names</li>
                <li>31 benchmarked conditions at launch</li>
              </ul>
            </div>
            <div className="spotlight-visual">
              <div className="mock-card">
                <div className="mock-table-head">
                  <span>Setting</span>
                  <span>Medicare</span>
                  <span>PPO</span>
                  <span>HMO</span>
                </div>
                <div className="mock-table-row mock-table-row-strong">
                  <span>★ Primary Care</span>
                  <span>$22</span>
                  <span>$15</span>
                  <span>$0</span>
                </div>
                <div className="mock-table-row">
                  <span>Urgent Care</span>
                  <span>$75</span>
                  <span>$60</span>
                  <span>$40</span>
                </div>
                <div className="mock-table-row">
                  <span>Specialist</span>
                  <span>$95</span>
                  <span>$80</span>
                  <span>$55</span>
                </div>
                <div className="mock-table-row">
                  <span>Hospital</span>
                  <span>$180</span>
                  <span>$145</span>
                  <span>$110</span>
                </div>
                <p className="mock-caption">★ Saves up to $180 vs hospital path</p>
              </div>
            </div>
          </div>

          <div className="landing-surface-alt">
            <div className="landing-container spotlight-row spotlight-row-reversed">
              <div className="spotlight-copy">
                <p className="landing-eyebrow">Dispute generation</p>
                <h3>Two letters. One for your provider. One for your insurer.</h3>
                <p>
                  Providers and insurers have different roles in the billing chain. BillPilot writes separate, targeted
                  letters with the right escalation language for each recipient.
                </p>
                <ul className="spotlight-list">
                  <li>Evidence pulled directly from your bill</li>
                  <li>Correct escalation language for each recipient</li>
                  <li>Ready to copy and send in under 30 seconds</li>
                  <li>No AI hallucination — deterministic, evidence-based output</li>
                </ul>
              </div>
              <div className="spotlight-visual">
                <div className="mock-letter-card">
                  <div className="mock-letter-copy">
                    <p>Subject: Request for billing review and coding justification</p>
                    <p>Billing Department,</p>
                    <p>I am requesting a formal review of the charges on my recent statement.</p>
                    <p>Based on my itemized review, several charges appear to warrant clarification or correction:</p>
                    <p>- Duplicate charge: Lab Processing Fee ($310.00)</p>
                    <p>- Facility fee: $2,150 appears materially above the benchmark anchor</p>
                    <p>- Same-day overlap between ancillary services and evaluation coding</p>
                    <p>Please provide CPT-level justification or issue a corrected statement.</p>
                  </div>
                  <div className="mock-letter-fade" />
                </div>
                <div className="mock-letter-pills">
                  <span>Provider letter</span>
                  <span>Insurer letter</span>
                  <em>→ One click to copy each</em>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-container spotlight-row">
            <div className="spotlight-copy">
              <p className="landing-eyebrow">Local market context</p>
              <h3>Your ZIP code changes everything.</h3>
              <p>
                Healthcare costs vary dramatically by location. Enter your ZIP and BillPilot resolves real nearby
                facilities, dominant commercial carriers in your market, and region-specific plan naming.
              </p>
            </div>
            <div className="spotlight-visual">
              <div className="market-mock-card">
                <span className="market-mock-badge">📍 60601</span>
                <h4>Chicago, Illinois</h4>
                <p>Chicago&apos;s dense network means strong PPO options and negotiated rates below national average.</p>
                <div className="market-mock-section">
                  <span>Likely carriers</span>
                  <strong>Blue Cross Blue Shield · Aetna · UnitedHealthcare · Cigna</strong>
                </div>
                <div className="market-mock-section">
                  <span>Nearby facilities</span>
                  <ul>
                    <li>
                      <strong>Northwestern Memorial Hospital</strong>
                      <span>Hospital Outpatient</span>
                    </li>
                    <li>
                      <strong>Advocate Illinois Masonic</strong>
                      <span>Urgent Care</span>
                    </li>
                    <li>
                      <strong>One Medical Lincoln Park</strong>
                      <span>Primary Care Clinic</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-trust">
          <div className="landing-container">
            <h2>Built on real data. Not estimates.</h2>
            <div className="landing-trust-grid">
              <article>
                <strong>31</strong>
                <span>Benchmarked conditions</span>
              </article>
              <article>
                <strong>CMS</strong>
                <span>Medicare rates as the pricing floor</span>
              </article>
              <article>
                <strong>6</strong>
                <span>Insurance plan types modeled</span>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-container landing-final-inner">
            <h2>Medical billing shouldn&apos;t require a lawyer.</h2>
            <p>
              BillPilot puts CMS benchmark data and dispute-ready output in your hands — before you book and after
              you&apos;re billed.
            </p>
            <div className="landing-hero-actions">
              <Link className="landing-button landing-button-light" href="/app?tab=bill">
                Audit my bill free →
              </Link>
              <Link className="landing-button landing-button-outline" href="/app?tab=explorer">
                Explore care costs
              </Link>
            </div>
            <p className="landing-disclaimer">
              Cost estimates are based on CMS Medicare benchmark data and modeled plan assumptions. For informational
              purposes only — not medical advice.
            </p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <span>BillPilot AI</span>
          <span>Built with Next.js, TypeScript, and Claude AI</span>
        </div>
      </footer>
    </div>
  );
}
