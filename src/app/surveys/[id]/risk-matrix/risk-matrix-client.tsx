"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { cn, riskRating } from "@/lib/utils";
import toast from "react-hot-toast";

type RiskEntry = {
  id: string;
  threatName: string;
  threatDescription: string | null;
  threat: number;
  vulnerability: number;
  impact: number;
  riskScore: number;
  riskRating: string;
  mitigation: string | null;
};

export function RiskMatrixClient({
  surveyId,
  surveyName,
  initialEntries,
}: {
  surveyId: string;
  surveyName: string;
  initialEntries: RiskEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    threatName: "",
    threatDescription: "",
    threat: 3,
    vulnerability: 3,
    impact: 3,
    mitigation: "",
  });

  const riskScore = form.threat * form.vulnerability * form.impact;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.threatName.trim()) {
      toast.error("Threat name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      const entry = await res.json();
      setEntries((prev) =>
        [...prev, entry].sort((a, b) => b.riskScore - a.riskScore)
      );
      setForm({
        threatName: "",
        threatDescription: "",
        threat: 3,
        vulnerability: 3,
        impact: 3,
        mitigation: "",
      });
      setShowForm(false);
      toast.success("Risk entry added");
    } catch {
      toast.error("Failed to save risk entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (riskId: string) => {
    try {
      await fetch(`/api/surveys/${surveyId}/risks/${riskId}`, {
        method: "DELETE",
      });
      setEntries((prev) => prev.filter((e) => e.id !== riskId));
      toast.success("Risk entry deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  // Build 5x5 matrix data
  const matrixCells: Record<string, RiskEntry[]> = {};
  for (const entry of entries) {
    // Use threat (likelihood) as Y axis, impact as X axis
    const key = `${entry.threat}-${entry.impact}`;
    if (!matrixCells[key]) matrixCells[key] = [];
    matrixCells[key].push(entry);
  }

  const cellColor = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    if (score >= 20) return "bg-red-700/80";
    if (score >= 12) return "bg-red-500/60";
    if (score >= 6) return "bg-yellow-500/50";
    if (score >= 3) return "bg-green-500/40";
    return "bg-blue-500/30";
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/surveys/${surveyId}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-lg">{surveyName}</h1>
              <p className="text-xs text-muted-foreground">Risk Matrix</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Risk
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Add Risk Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">New Risk Entry</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Threat Name
              </label>
              <input
                type="text"
                value={form.threatName}
                onChange={(e) =>
                  setForm({ ...form, threatName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g., Unauthorized entry through rear door"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={form.threatDescription}
                onChange={(e) =>
                  setForm({ ...form, threatDescription: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { key: "threat" as const, label: "Threat (Likelihood)" },
                { key: "vulnerability" as const, label: "Vulnerability" },
                { key: "impact" as const, label: "Impact" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">
                    {label}: {form[key]}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: parseInt(e.target.value) })
                    }
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>5</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Risk Score:
              </span>
              <span
                className={`px-2 py-0.5 rounded text-sm font-bold ${riskRating(riskScore).color}`}
              >
                {riskScore} — {riskRating(riskScore).label}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Mitigation / Recommendation
              </label>
              <textarea
                value={form.mitigation}
                onChange={(e) =>
                  setForm({ ...form, mitigation: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Risk Entry"}
            </button>
          </form>
        )}

        {/* 5x5 Matrix Visualization */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-medium mb-4">Risk Matrix (Likelihood x Impact)</h3>
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              <div className="flex items-end mb-1">
                <div className="w-20 shrink-0" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex-1 text-center text-xs text-muted-foreground"
                  >
                    {i}
                  </div>
                ))}
              </div>

              {[5, 4, 3, 2, 1].map((likelihood) => (
                <div key={likelihood} className="flex items-stretch mb-1">
                  <div className="w-20 shrink-0 flex items-center text-xs text-muted-foreground pr-2 justify-end">
                    {likelihood}
                  </div>
                  {[1, 2, 3, 4, 5].map((impact) => {
                    const key = `${likelihood}-${impact}`;
                    const cellEntries = matrixCells[key] || [];
                    return (
                      <div
                        key={impact}
                        className={cn(
                          "flex-1 aspect-square rounded-md mx-0.5 flex items-center justify-center text-xs font-medium min-h-[40px]",
                          cellColor(likelihood, impact)
                        )}
                      >
                        {cellEntries.length > 0 && (
                          <span className="bg-background/80 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {cellEntries.length}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              <div className="flex mt-1">
                <div className="w-20 shrink-0" />
                <div className="flex-1 text-center text-xs text-muted-foreground">
                  Impact →
                </div>
              </div>
              <div className="flex">
                <div className="w-20 shrink-0 text-right pr-2 text-xs text-muted-foreground">
                  ↑ Likelihood
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Entries Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <h3 className="font-medium p-4 border-b border-border">
            Risk Entries ({entries.length})
          </h3>
          {entries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No risk entries yet. Add one above.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {entries.map((entry) => {
                const rating = riskRating(entry.riskScore);
                return (
                  <div key={entry.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {entry.threatName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${rating.color}`}
                          >
                            {entry.riskScore} — {rating.label}
                          </span>
                        </div>
                        {entry.threatDescription && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {entry.threatDescription}
                          </p>
                        )}
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>T: {entry.threat}</span>
                          <span>V: {entry.vulnerability}</span>
                          <span>I: {entry.impact}</span>
                        </div>
                        {entry.mitigation && (
                          <p className="text-xs mt-2 text-muted-foreground">
                            <span className="font-medium text-foreground">
                              Mitigation:
                            </span>{" "}
                            {entry.mitigation}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
