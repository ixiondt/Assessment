import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ChecklistClient } from "./checklist-client";

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      responses: true,
    },
  });

  if (!survey) notFound();

  const categories = await prisma.checklistCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  // Build a map of existing responses
  const responseMap: Record<
    string,
    { score: number | null; notes: string; na: boolean }
  > = {};
  for (const r of survey.responses) {
    responseMap[r.itemId] = {
      score: r.score,
      notes: r.notes || "",
      na: r.na,
    };
  }

  return (
    <ChecklistClient
      surveyId={id}
      surveyName={survey.clientName}
      categories={categories}
      initialResponses={responseMap}
      initialOverallScore={survey.overallScore}
    />
  );
}
