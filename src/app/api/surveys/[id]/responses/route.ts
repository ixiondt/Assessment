import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const responseSchema = z.object({
  itemId: z.string(),
  score: z.number().min(1).max(5).nullable(),
  notes: z.string().optional(),
  na: z.boolean().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: surveyId } = await params;
  const body = await request.json();
  const data = responseSchema.parse(body);

  const response = await prisma.checklistResponse.upsert({
    where: {
      surveyId_itemId: { surveyId, itemId: data.itemId },
    },
    update: {
      score: data.na ? null : data.score,
      notes: data.notes,
      na: data.na ?? false,
    },
    create: {
      surveyId,
      itemId: data.itemId,
      score: data.na ? null : data.score,
      notes: data.notes,
      na: data.na ?? false,
    },
  });

  // Recalculate overall score
  const allResponses = await prisma.checklistResponse.findMany({
    where: { surveyId, na: false, score: { not: null } },
    include: { item: { include: { category: true } } },
  });

  if (allResponses.length > 0) {
    const categoryScores: Record<string, { total: number; count: number; weight: number }> = {};
    for (const r of allResponses) {
      const catId = r.item.category.id;
      if (!categoryScores[catId]) {
        categoryScores[catId] = { total: 0, count: 0, weight: r.item.category.weight };
      }
      categoryScores[catId].total += r.score!;
      categoryScores[catId].count += 1;
    }

    let weightedSum = 0;
    let totalWeight = 0;
    for (const cat of Object.values(categoryScores)) {
      const avg = cat.total / cat.count;
      weightedSum += avg * cat.weight;
      totalWeight += cat.weight;
    }

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : null;

    await prisma.survey.update({
      where: { id: surveyId },
      data: {
        overallScore,
        status: "in_progress",
      },
    });
  }

  return NextResponse.json(response);
}
