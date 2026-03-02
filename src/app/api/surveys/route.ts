import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  clientName: z.string().min(1),
  clientType: z.enum(["business", "church", "school", "hoa"]),
  address: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const survey = await prisma.survey.create({
      data: {
        ...data,
        contactEmail: data.contactEmail || null,
      },
    });

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create survey" }, { status: 500 });
  }
}

export async function GET() {
  const surveys = await prisma.survey.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { responses: true, riskEntries: true, photos: true },
      },
    },
  });
  return NextResponse.json(surveys);
}
