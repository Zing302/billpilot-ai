"use client";

import type { TreatmentExplorerResult } from "@/lib/schemas/billpilot";
import { formatZipInput } from "@/lib/format";
import { useState } from "react";

const initialStatus = "Enter a supported condition and optional ZIP code to benchmark the lowest-friction care path.";

export const explorerExamples = ["UTI", "Knee Pain Workup", "Type 2 Diabetes Follow-up", "ACL MRI Pathway"];

export function useExplorer() {
  const [condition, setCondition] = useState("UTI");
  const [zipCode, setZipCode] = useState("60601");
  const [result, setResult] = useState<TreatmentExplorerResult | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const trimmedCondition = condition.trim();
  const normalizedZip = zipCode.replace(/[^\d]/g, "");
  const conditionError = trimmedCondition ? null : "Enter a medical condition to benchmark.";
  const zipError =
    zipCode.trim().length > 0 && !(normalizedZip.length === 5 || normalizedZip.length === 9)
      ? "Enter a 5-digit ZIP or ZIP+4."
      : null;

  async function analyze() {
    if (conditionError) {
      setHasError(true);
      setStatus(conditionError);
      return;
    }

    if (zipError) {
      setHasError(true);
      setStatus(zipError);
      return;
    }

    setLoading(true);
    setHasError(false);
    setStatus("Building the local market view…");

    try {
      const response = await fetch("/api/treatment-explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition, zipCode }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Treatment analysis failed.");
      setResult(payload);
      setStatus(
        payload.supported
          ? `Local benchmark ready for ${payload.condition}.`
          : "That condition is outside the current launch set, but you can switch to a supported example instantly.",
      );
    } catch (error) {
      setHasError(true);
      setStatus(error instanceof Error ? error.message : "Treatment analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setHasError(false);
    setStatus(initialStatus);
  }

  return {
    condition,
    setCondition,
    zipCode,
    setZipCode: (value: string) => setZipCode(formatZipInput(value)),
    result,
    status,
    loading,
    hasError,
    conditionError,
    zipError,
    analyze,
    reset,
  };
}
