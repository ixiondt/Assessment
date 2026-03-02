import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { RiskMatrixClient } from "./risk-matrix-client";

export default async function RiskMatrixPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      riskEntries: { orderBy: { riskScore: "desc" } },
    },
  });

  if (!survey) notFound();

  return (
    <RiskMatrixClient
      surveyId={id}
      surveyName={survey.clientName}
      initialEntries={survey.riskEntries}
    />
  );
}
