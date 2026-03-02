import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { riskRatingFromScore } from "@/lib/utils";

const riskSchema = z.object({
  threatName: z.string().min(1),
  threatDescription: z.string().optional(),
  threat: z.number().min(1).max(5),
  vulnerability: z.number().min(1).max(5),
  impact: z.number().min(1).max(5),
  mitigation: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: surveyId } = await params;
  const body = await request.json();
  const data = riskSchema.parse(body);

  const riskScore = data.threat * data.vulnerability * data.impact;
  const riskRating = riskRatingFromScore(riskScore);

  const entry = await prisma.riskEntry.create({
    data: {
      surveyId,
      ...data,
      riskScore,
      riskRating,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: surveyId } = await params;
  const entries = await prisma.riskEntry.findMany({
    where: { surveyId },
    orderBy: { riskScore: "desc" },
  });
  return NextResponse.json(entries);
}
