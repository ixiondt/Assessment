import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const annotationSchema = z.object({
  type: z.enum(["pin", "rectangle"]),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  label: z.string().optional(),
  color: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { photoId } = await params;
  const body = await request.json();
  const data = annotationSchema.parse(body);

  const annotation = await prisma.annotation.create({
    data: {
      photoId,
      ...data,
      color: data.color || "#ef4444",
    },
  });

  return NextResponse.json(annotation, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { photoId } = await params;
  const url = new URL(request.url);
  const annotationId = url.searchParams.get("annotationId");

  if (annotationId) {
    await prisma.annotation.delete({ where: { id: annotationId } });
  } else {
    await prisma.annotation.deleteMany({ where: { photoId } });
  }

  return NextResponse.json({ success: true });
}
