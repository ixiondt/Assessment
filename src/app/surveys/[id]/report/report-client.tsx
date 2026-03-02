"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { formatDate, scoreColor, statusLabel } from "@/lib/utils";
import dynamic from "next/dynamic";

const PDFDownloadButton = dynamic(
  () => import("./pdf-document").then((mod) => mod.PDFDownloadButton),
  { ssr: false, loading: () => <span>Loading PDF engine...</span> }
);

type CategoryScore = {
  name: string;
  weight: number;
  average: number | null;
  totalItems: number;
  answeredItems: number;
  items: {
    text: string;
    score: number | null;
    notes: string | null;
    na: boolean;
  }[];
};

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

type SurveyData = {
  clientName: string;
  clientType: string;
  address: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  overallScore: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type PhotoData = {
  id: string;
  filepath: string;
  caption: string | null;
  location: string | null;
  annotations: {
    id: string;
    type: string;
    label: string | null;
  }[];
};

export function ReportClient({
  surveyId,
  survey,
  categoryScores,
  riskEntries,
  photos,
}: {
  surveyId: string;
  survey: SurveyData;
  categoryScores: CategoryScore[];
  riskEntries: RiskEntry[];
  photos: PhotoData[];
}) {
  const scoreColorClass = (score: number | null) => {
    if (!score) return "text-gray-400";
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    if (score >= 2) return "text-orange-600";
    return "text-red-600";
  };

  const ratingColor = (rating: string) => {
    switch (rating) {
      case "critical":
        return "text-red-700 bg-red-100";
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-700 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
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
              <h1 className="font-semibold text-lg">{survey.clientName}</h1>
              <p className="text-xs text-muted-foreground">Report</p>
            </div>
          </div>
          <PDFDownloadButton
            survey={survey}
            categoryScores={categoryScores}
            riskEntries={riskEntries}
            photos={photos}
          />
        </div>
      </div>

      {/* Report Preview */}
      <div className="p-4 space-y-6">
        {/* Cover info */}
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Physical Security Assessment Report
          </div>
          <h2 className="text-2xl font-bold mb-2">{survey.clientName}</h2>
          <p className="text-muted-foreground">
            {survey.clientType.charAt(0).toUpperCase() +
              survey.clientType.slice(1)}
            {survey.address && ` — ${survey.address}`}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {formatDate(survey.createdAt)}
          </p>
          {survey.overallScore !== null && (
            <div className="mt-4">
              <span
                className={`text-3xl font-bold ${scoreColorClass(survey.overallScore)}`}
              >
                {survey.overallScore.toFixed(1)}
              </span>
              <span className="text-muted-foreground text-lg"> / 5.0</span>
            </div>
          )}
        </div>

        {/* Executive Summary */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Executive Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-sm text-muted-foreground">
                Categories Assessed
              </div>
              <div className="text-xl font-bold">
                {categoryScores.filter((c) => c.answeredItems > 0).length}/
                {categoryScores.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Risk Entries
              </div>
              <div className="text-xl font-bold">{riskEntries.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Photos</div>
              <div className="text-xl font-bold">{photos.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="text-xl font-bold">
                {statusLabel(survey.status)}
              </div>
            </div>
          </div>
          {survey.notes && (
            <p className="text-sm text-muted-foreground">{survey.notes}</p>
          )}
        </div>

        {/* Category Findings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">
            Assessment Findings by Category
          </h3>
          <div className="space-y-4">
            {categoryScores.map((cat) => (
              <div key={cat.name} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{cat.name}</span>
                  <span
                    className={`font-bold ${scoreColorClass(cat.average)}`}
                  >
                    {cat.average !== null ? cat.average.toFixed(1) : "N/A"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {cat.answeredItems}/{cat.totalItems} items assessed — Weight:{" "}
                  {cat.weight}x
                </div>
                {/* Show items scored below 3 */}
                {cat.items
                  .filter((i) => i.score !== null && i.score < 3)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="text-sm ml-4 py-1 flex items-start gap-2"
                    >
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-bold ${scoreColor(item.score)}`}
                      >
                        {item.score}
                      </span>
                      <div>
                        <span>{item.text}</span>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* Risk Matrix */}
        {riskEntries.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-4">Risk Assessment</h3>
            <div className="space-y-3">
              {riskEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                >
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${ratingColor(entry.riskRating)}`}
                  >
                    {entry.riskScore}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">
                      {entry.threatName}
                    </div>
                    {entry.threatDescription && (
                      <p className="text-xs text-muted-foreground">
                        {entry.threatDescription}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      T:{entry.threat} × V:{entry.vulnerability} × I:
                      {entry.impact} ={" "}
                      <span className="font-medium">
                        {entry.riskRating.charAt(0).toUpperCase() +
                          entry.riskRating.slice(1)}
                      </span>
                    </div>
                    {entry.mitigation && (
                      <p className="text-xs mt-1">
                        <span className="font-medium">Recommendation: </span>
                        {entry.mitigation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-4">Photo Documentation</h3>
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo) => (
                <div key={photo.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.filepath}
                    alt={photo.caption || "Photo"}
                    className="w-full rounded-lg"
                  />
                  {photo.caption && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {photo.caption}
                    </p>
                  )}
                  {photo.annotations.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {photo.annotations.length} annotation(s)
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
