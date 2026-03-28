"use client";

import { cleanBillText, seededBillText } from "@/data/demo-fixtures";
import type { BillAnalysisResult, BillParseResult, DisputeDraftResult } from "@/lib/schemas/billpilot";
import { useMemo, useState } from "react";

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

  const inputError = billText.trim() || uploadedFile ? null : "Paste an itemized bill or upload a text, CSV, or PDF file first.";

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
    setUploadedFile(null);
    setBillText(seededBillText);
    reset();
  }

  function loadCleanExample() {
    setUploadedFile(null);
    setBillText(cleanBillText);
    reset();
  }

  async function uploadBill(file: File) {
    const fileContent = await file.text();
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

  function reset() {
    setUploadedFile(null);
    setParseResult(null);
    setAnalysisResult(null);
    setDrafts(null);
    setHasError(false);
    setStatus(initialStatus);
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
      const response = await fetch("/api/analyze-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineItems: parseResult.lineItems, statedTotal: parseResult.totals.statedTotal }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Analysis failed.");
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
      const response = await fetch("/api/generate-dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findings: analysisResult.findings, lineItems: parseResult.lineItems }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Draft generation failed.");
      setDrafts(payload);
      setStatus("Drafts are ready to copy.");
    } catch (error) {
      setHasError(true);
      setStatus(error instanceof Error ? error.message : "Draft generation failed.");
    } finally {
      setLoading(false);
    }
  }

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
