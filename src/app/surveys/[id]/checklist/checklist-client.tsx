"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import { cn, scoreColor } from "@/lib/utils";
import toast from "react-hot-toast";

type Category = {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  sortOrder: number;
  items: {
    id: string;
    text: string;
    description: string | null;
    sortOrder: number;
  }[];
};

type ResponseData = {
  score: number | null;
  notes: string;
  na: boolean;
};

export function ChecklistClient({
  surveyId,
  surveyName,
  categories,
  initialResponses,
  initialOverallScore,
}: {
  surveyId: string;
  surveyName: string;
  categories: Category[];
  initialResponses: Record<string, ResponseData>;
  initialOverallScore: number | null;
}) {
  const [responses, setResponses] = useState(initialResponses);
  const [overallScore, setOverallScore] = useState(initialOverallScore);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );
  const [notesOpen, setNotesOpen] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const saveTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const saveResponse = useCallback(
    (itemId: string, data: ResponseData) => {
      // Clear existing timer
      if (saveTimers.current[itemId]) {
        clearTimeout(saveTimers.current[itemId]);
      }

      setSaving((prev) => new Set(prev).add(itemId));

      saveTimers.current[itemId] = setTimeout(async () => {
        try {
          const res = await fetch(`/api/surveys/${surveyId}/responses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemId,
              score: data.score,
              notes: data.notes,
              na: data.na,
            }),
          });

          if (!res.ok) throw new Error();

          // Recalculate local overall score
          const allResponses = { ...responses, [itemId]: data };
          const categoryScores: Record<
            string,
            { total: number; count: number; weight: number }
          > = {};
          for (const cat of categories) {
            for (const item of cat.items) {
              const r = allResponses[item.id];
              if (r && !r.na && r.score !== null) {
                if (!categoryScores[cat.id]) {
                  categoryScores[cat.id] = {
                    total: 0,
                    count: 0,
                    weight: cat.weight,
                  };
                }
                categoryScores[cat.id].total += r.score;
                categoryScores[cat.id].count += 1;
              }
            }
          }

          let weightedSum = 0;
          let totalWeight = 0;
          for (const cs of Object.values(categoryScores)) {
            const avg = cs.total / cs.count;
            weightedSum += avg * cs.weight;
            totalWeight += cs.weight;
          }
          setOverallScore(
            totalWeight > 0 ? weightedSum / totalWeight : null
          );
        } catch {
          toast.error("Failed to save");
        } finally {
          setSaving((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
        }
      }, 500);
    },
    [surveyId, responses, categories]
  );

  const setScore = (itemId: string, score: number) => {
    const current = responses[itemId] || { score: null, notes: "", na: false };
    const newData = { ...current, score, na: false };
    setResponses((prev) => ({ ...prev, [itemId]: newData }));
    saveResponse(itemId, newData);
  };

  const toggleNA = (itemId: string) => {
    const current = responses[itemId] || { score: null, notes: "", na: false };
    const newData = { ...current, na: !current.na, score: null };
    setResponses((prev) => ({ ...prev, [itemId]: newData }));
    saveResponse(itemId, newData);
  };

  const setNotes = (itemId: string, notes: string) => {
    const current = responses[itemId] || { score: null, notes: "", na: false };
    const newData = { ...current, notes };
    setResponses((prev) => ({ ...prev, [itemId]: newData }));
    saveResponse(itemId, newData);
  };

  const toggleCategory = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const getCategoryAvg = (cat: Category) => {
    const scored = cat.items
      .map((item) => responses[item.id])
      .filter((r) => r && !r.na && r.score !== null);
    if (scored.length === 0) return null;
    return scored.reduce((s, r) => s + r!.score!, 0) / scored.length;
  };

  const getCategoryProgress = (cat: Category) => {
    const answered = cat.items.filter((item) => {
      const r = responses[item.id];
      return r && (r.score !== null || r.na);
    }).length;
    return { answered, total: cat.items.length };
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Sticky header */}
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
              <p className="text-xs text-muted-foreground">Checklist</p>
            </div>
          </div>
          {overallScore !== null && (
            <div
              className={`px-3 py-1.5 rounded-lg text-sm font-bold ${scoreColor(Math.round(overallScore))}`}
            >
              {overallScore.toFixed(1)} / 5.0
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {categories.map((cat) => {
          const expanded = expandedCats.has(cat.id);
          const avg = getCategoryAvg(cat);
          const progress = getCategoryProgress(cat);

          return (
            <div
              key={cat.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {expanded ? (
                    <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{cat.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {progress.answered}/{progress.total} completed
                    </div>
                  </div>
                </div>
                {avg !== null && (
                  <span
                    className={`px-2 py-0.5 rounded text-sm font-bold shrink-0 ${scoreColor(Math.round(avg))}`}
                  >
                    {avg.toFixed(1)}
                  </span>
                )}
              </button>

              {/* Items */}
              {expanded && (
                <div className="border-t border-border divide-y divide-border">
                  {cat.items.map((item) => {
                    const r = responses[item.id];
                    const isNA = r?.na ?? false;
                    const currentScore = r?.score ?? null;
                    const isSaving = saving.has(item.id);
                    const showNotes = notesOpen.has(item.id);

                    return (
                      <div key={item.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm",
                                isNA && "line-through text-muted-foreground"
                              )}
                            >
                              {item.text}
                            </p>
                          </div>
                          {isSaving && (
                            <span className="text-xs text-muted-foreground animate-pulse shrink-0">
                              Saving...
                            </span>
                          )}
                        </div>

                        {/* Score buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              onClick={() => setScore(item.id, score)}
                              disabled={isNA}
                              className={cn(
                                "w-[56px] h-[44px] rounded-lg text-sm font-bold transition-all",
                                currentScore === score
                                  ? scoreColor(score)
                                  : "bg-muted text-muted-foreground hover:opacity-80",
                                isNA && "opacity-30 cursor-not-allowed"
                              )}
                            >
                              {score}
                            </button>
                          ))}
                          <button
                            onClick={() => toggleNA(item.id)}
                            className={cn(
                              "px-3 h-[44px] rounded-lg text-sm font-medium transition-all border",
                              isNA
                                ? "bg-gray-500 text-white border-gray-500"
                                : "border-border text-muted-foreground hover:border-gray-400"
                            )}
                          >
                            N/A
                          </button>
                          <button
                            onClick={() => {
                              setNotesOpen((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              });
                            }}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              r?.notes
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Notes */}
                        {showNotes && (
                          <textarea
                            value={r?.notes ?? ""}
                            onChange={(e) =>
                              setNotes(item.id, e.target.value)
                            }
                            placeholder="Add notes..."
                            rows={2}
                            className="w-full mt-3 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
