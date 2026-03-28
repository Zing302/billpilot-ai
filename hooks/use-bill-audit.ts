"use client";

import { cleanBillText, seededBillText } from "@/data/demo-fixtures";
import type { BillAnalysisResult, BillParseResult, DisputeDraftResult } from "@/lib/schemas/billpilot";
import { useEffect, useMemo, useRef, useState } from "react";

const initialStatus = "Paste an itemized bill or load a sample to begin.";

type UploadedBill = {
  fileName: string;
  fileContent: string;
  mimeType: string;
};

export function useBillAudit() {
  const [billText, setBillText] = useState(seededBillText);
  const [uploadedFile, setUploadedFile] = useState<UploadedBill | null>(null);
  const [parseResult, setParseResult] = useState<BillParseResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<BillAnalysisResult | null>(null);
  const [drafts, setDrafts] = useState<DisputeDraftResult | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const hasAutoplayedSeededExample = useRef(false);

  const inputError = billText.trim() || uploadedFile ? null : "Paste an itemized bill or upload a text or CSV file first.";

  const steps = useMemo(
    () => [
      { label: "Paste", active: true, onSelect: () => reset() },
      { label: "Review", active: Boolean(parseResult), onSelect: () => clearToReview() },
      { label: "Analyze", active: Boolean(analysisResult), onSelect: () => clearToAnalysis() },
      { label: "Draft", active: Boolean(drafts), onSelect: () => undefined },
    ],
    [analysisResult, drafts, parseResult],
  );

  function loadFlaggedExample() {
    hasAutoplayedSeededExample.current = false;
    setUploadedFile(null);
    setBillText(seededBillText);
    resetWorkflow();
  }

  function loadCleanExample() {
    hasAutoplayedSeededExample.current = true;
    setUploadedFile(null);
    setBillText(cleanBillText);
    resetWorkflow();
  }

  async function uploadBill(file: File) {
    const fileContent = await file.text();
    hasAutoplayedSeededExample.current = true;
    setBillText("");
    setUploadedFile({
      fileName: file.name,
      fileContent,
      mimeType: file.type || "text/plain",
    });
    setHasError(false);
    setStatus(`Loaded ${file.name}. Parse it to extract line items.`);
  }

  function clearUploadedFile() {
    setUploadedFile(null);
    setHasError(false);
    setStatus(initialStatus);
  }

  function clearToReview() {
    setAnalysisResult(null);
    setDrafts(null);
    setHasError(false);
    setStatus("Review the extracted lines, then run the benchmark check.");
  }

  function clearToAnalysis() {
    setDrafts(null);
    setHasError(false);
    if (analysisResult) setStatus("Review the strongest findings, then generate the outreach drafts.");
  }

  function resetWorkflow() {
    setParseResult(null);
    setAnalysisResult(null);
    setDrafts(null);
    setHasError(false);
    setStatus(initialStatus);
  }

  function reset() {
    hasAutoplayedSeededExample.current = true;
    setUploadedFile(null);
    resetWorkflow();
  }

  async function requestParse() {
    if (inputError) {
      throw new Error(inputError);
    }

    const response = await fetch("/api/parse-bill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        uploadedFile
          ? {
              fileName: uploadedFile.fileName,
              fileContent: uploadedFile.fileContent,
              mimeType: uploadedFile.mimeType,
            }
          : { rawText: billText },
      ),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Bill parse failed.");
    return payload as BillParseResult;
  }

  async function requestAnalysis(parsed: BillParseResult) {
    const response = await fetch("/api/analyze-bill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineItems: parsed.lineItems, statedTotal: parsed.totals.statedTotal }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Analysis failed.");
    return payload as BillAnalysisResult;
  }

  async function requestDrafts(parsed: BillParseResult, analysis: BillAnalysisResult) {
    const response = await fetch("/api/generate-dispute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ findings: analysis.findings, lineItems: parsed.lineItems }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Draft generation failed.");
    return payload as DisputeDraftResult;
  }

  async function parseBill() {
    if (inputError) {
      setHasError(true);
      setStatus(inputError);
      return;
    }

    setLoading(true);
    setHasError(false);
    setStatus("Parsing and cleaning the bill…");

    try {
      const payload = await requestParse();
      setParseResult(payload);
      setAnalysisResult(null);
      setDrafts(null);
      setStatus("Review the extracted lines, then run the benchmark check.");
    } catch (error) {
      setHasError(true);
      setStatus(error instanceof Error ? error.message : "Bill parse failed.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeBill() {
    if (!parseResult) return;
    setLoading(true);
    setHasError(false);
    setStatus("Checking for duplicates, benchmark variance, and facility-fee issues…");

    try {
      const payload = await requestAnalysis(parseResult);
      setAnalysisResult(payload);
      setDrafts(null);
      setStatus("Review the strongest findings, then generate the outreach drafts.");
    } catch (error) {
      setHasError(true);
      setStatus(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  async function generateDrafts() {
    if (!parseResult || !analysisResult) return;
    setLoading(true);
    setHasError(false);
    setStatus("Writing provider and insurer drafts…");

    try {
      const payload = await requestDrafts(parseResult, analysisResult);
      setDrafts(payload);
      setStatus("Drafts are ready to copy.");
    } catch (error) {
      setHasError(true);
      setStatus(error instanceof Error ? error.message : "Draft generation failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (
      hasAutoplayedSeededExample.current ||
      uploadedFile ||
      billText.trim() !== seededBillText ||
      parseResult ||
      analysisResult ||
      drafts ||
      loading
    ) {
      return;
    }

    hasAutoplayedSeededExample.current = true;
    setLoading(true);
    setHasError(false);
    setStatus("Running the seeded bill review demo…");

    void (async () => {
      try {
        const parsed = await requestParse();
        setParseResult(parsed);
        setStatus("Checking the seeded example against benchmark and duplicate-charge rules…");

        const analysis = await requestAnalysis(parsed);
        setAnalysisResult(analysis);
        setStatus("Writing provider and insurer drafts for the seeded example…");

        const generatedDrafts = await requestDrafts(parsed, analysis);
        setDrafts(generatedDrafts);
        setStatus("Seeded example is fully reviewed. The findings and drafts are ready.");
      } catch (error) {
        setHasError(true);
        setStatus(error instanceof Error ? error.message : "Seeded demo run failed.");
      } finally {
        setLoading(false);
      }
    })();
  }, [analysisResult, billText, drafts, loading, parseResult, uploadedFile]);

  const nextAction = !parseResult
    ? { label: loading ? "Working…" : "Parse Bill", onClick: parseBill }
    : !analysisResult
      ? { label: loading ? "Working…" : "Analyze Bill", onClick: analyzeBill }
      : !drafts
        ? { label: loading ? "Working…" : "Generate Drafts", onClick: generateDrafts }
        : null;

  const nextActionHint = !parseResult
    ? "Parse the uploaded or pasted bill into structured line items."
    : !analysisResult
      ? "Run the benchmark and issue check on the extracted line items."
      : !drafts
        ? "Turn the findings into provider and insurer outreach drafts."
        : "All workflow steps are complete.";

  return {
    billText,
    setBillText: (value: string) => {
      setUploadedFile(null);
      setBillText(value);
    },
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
    parseBill,
    analyzeBill,
    generateDrafts,
    reset,
  };
}
