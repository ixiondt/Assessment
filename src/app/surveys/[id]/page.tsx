import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  AlertTriangle,
  Camera,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { formatDate, statusLabel, statusColor, scoreColor } from "@/lib/utils";

export default async function SurveyOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      responses: { include: { item: { include: { category: true } } } },
      riskEntries: { orderBy: { riskScore: "desc" } },
      _count: { select: { responses: true, riskEntries: true, photos: true } },
    },
  });

  if (!survey) notFound();

  const categories = await prisma.checklistCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { items: true },
  });

  // Compute per-category scores
  const categoryStats = categories.map((cat) => {
    const catResponses = survey.responses.filter(
      (r) => r.item.category.id === cat.id && !r.na && r.score !== null
    );
    const avg =
      catResponses.length > 0
        ? catResponses.reduce((s, r) => s + r.score!, 0) / catResponses.length
        : null;
    return {
      id: cat.id,
      name: cat.name,
      totalItems: cat.items.length,
      answered: catResponses.length,
      average: avg,
    };
  });

  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
  const answeredItems = survey.responses.filter(
    (r) => r.score !== null || r.na
  ).length;
  const progressPct = totalItems > 0 ? (answeredItems / totalItems) * 100 : 0;

  const tabs = [
    {
      href: `/surveys/${id}/checklist`,
      label: "Checklist",
      icon: ClipboardList,
      count: `${answeredItems}/${totalItems}`,
    },
    {
      href: `/surveys/${id}/risk-matrix`,
      label: "Risk Matrix",
      icon: AlertTriangle,
      count: survey._count.riskEntries,
    },
    {
      href: `/surveys/${id}/photos`,
      label: "Photos",
      icon: Camera,
      count: survey._count.photos,
    },
    {
      href: `/surveys/${id}/report`,
      label: "Report",
      icon: FileText,
      count: null,
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{survey.clientName}</h1>
            <p className="text-muted-foreground">
              {survey.clientType.charAt(0).toUpperCase() +
                survey.clientType.slice(1)}
              {survey.address && ` — ${survey.address}`}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(survey.status)}`}
          >
            {statusLabel(survey.status)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progressPct)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {survey.overallScore !== null && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Overall Score:
            </span>
            <span
              className={`px-2 py-0.5 rounded text-sm font-bold ${scoreColor(Math.round(survey.overallScore))}`}
            >
              {survey.overallScore.toFixed(1)} / 5.0
            </span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors text-center"
            >
              <Icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <div className="font-medium text-sm">{tab.label}</div>
              {tab.count !== null && (
                <div className="text-xs text-muted-foreground mt-1">
                  {tab.count}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Category Scores */}
      <h2 className="text-lg font-semibold mb-4">Category Scores</h2>
      <div className="space-y-3">
        {categoryStats.map((cat) => (
          <div
            key={cat.id}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{cat.name}</div>
                <div className="text-xs text-muted-foreground">
                  {cat.answered}/{cat.totalItems} items scored
                </div>
              </div>
              {cat.average !== null ? (
                <span
                  className={`px-2 py-0.5 rounded text-sm font-bold ${scoreColor(Math.round(cat.average))}`}
                >
                  {cat.average.toFixed(1)}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
