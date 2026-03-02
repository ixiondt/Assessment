import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; riskId: string }> }
) {
  const { riskId } = await params;
  await prisma.riskEntry.delete({ where: { id: riskId } });
  return NextResponse.json({ success: true });
}
