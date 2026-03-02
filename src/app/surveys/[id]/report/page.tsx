import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReportClient } from "./report-client";

export default async function ReportPage({
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
      photos: { include: { annotations: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!survey) notFound();

  const categories = await prisma.checklistCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  // Compute category scores
  const categoryScores = categories.map((cat) => {
    const catResponses = survey.responses.filter(
      (r) => r.item.category.id === cat.id && !r.na && r.score !== null
    );
    const avg =
      catResponses.length > 0
        ? catResponses.reduce((s, r) => s + r.score!, 0) / catResponses.length
        : null;
    const items = cat.items.map((item) => {
      const resp = survey.responses.find((r) => r.itemId === item.id);
      return {
        text: item.text,
        score: resp?.score ?? null,
        notes: resp?.notes ?? null,
        na: resp?.na ?? false,
      };
    });
    return {
      name: cat.name,
      weight: cat.weight,
      average: avg,
      totalItems: cat.items.length,
      answeredItems: catResponses.length,
      items,
    };
  });

  return (
    <ReportClient
      surveyId={id}
      survey={{
        clientName: survey.clientName,
        clientType: survey.clientType,
        address: survey.address,
        contactName: survey.contactName,
        contactEmail: survey.contactEmail,
        contactPhone: survey.contactPhone,
        status: survey.status,
        overallScore: survey.overallScore,
        notes: survey.notes,
        createdAt: survey.createdAt.toISOString(),
        updatedAt: survey.updatedAt.toISOString(),
      }}
      categoryScores={categoryScores}
      riskEntries={survey.riskEntries.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))}
      photos={survey.photos.map((p) => ({
        ...p,
        filepath: p.filepath,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
