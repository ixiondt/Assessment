import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, Shield, ClipboardList } from "lucide-react";
import { formatDate, statusLabel, statusColor } from "@/lib/utils";

export default async function DashboardPage() {
  const surveys = await prisma.survey.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { responses: true, riskEntries: true, photos: true },
      },
    },
  });

  const stats = {
    total: surveys.length,
    draft: surveys.filter((s) => s.status === "draft").length,
    inProgress: surveys.filter((s) => s.status === "in_progress").length,
    completed: surveys.filter((s) => s.status === "completed").length,
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your site security surveys
          </p>
        </div>
        <Link
          href="/surveys/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Survey</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Draft", value: stats.draft, color: "text-gray-500" },
          { label: "In Progress", value: stats.inProgress, color: "text-blue-500" },
          { label: "Completed", value: stats.completed, color: "text-green-500" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Survey List */}
      {surveys.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No surveys yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first site security survey to get started.
          </p>
          <Link
            href="/surveys/new"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Create Survey
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {surveys.map((survey) => (
            <Link
              key={survey.id}
              href={`/surveys/${survey.id}`}
              className="block bg-card border border-border rounded-xl p-4 md:p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg truncate">
                      {survey.clientName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(survey.status)}`}
                    >
                      {statusLabel(survey.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {survey.clientType.charAt(0).toUpperCase() + survey.clientType.slice(1)}
                    {survey.address && ` — ${survey.address}`}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>{survey._count.responses} responses</span>
                    <span>{survey._count.riskEntries} risks</span>
                    <span>{survey._count.photos} photos</span>
                    <span>Updated {formatDate(survey.updatedAt)}</span>
                  </div>
                </div>
                {survey.overallScore !== null && (
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold">
                      {survey.overallScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">/5.0</div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
