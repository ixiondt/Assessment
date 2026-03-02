import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      responses: { include: { item: { include: { category: true } } } },
      riskEntries: { orderBy: { riskScore: "desc" } },
      photos: { include: { annotations: true } },
      _count: {
        select: { responses: true, riskEntries: true, photos: true },
      },
    },
  });

  if (!survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  return NextResponse.json(survey);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const survey = await prisma.survey.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(survey);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.survey.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
