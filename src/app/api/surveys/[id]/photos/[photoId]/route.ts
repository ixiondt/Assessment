import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { photoId } = await params;

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (photo) {
    try {
      await unlink(path.join(process.cwd(), "public", photo.filepath));
    } catch {
      // File might not exist
    }
    await prisma.photo.delete({ where: { id: photoId } });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { photoId } = await params;
  const body = await request.json();

  const photo = await prisma.photo.update({
    where: { id: photoId },
    data: {
      caption: body.caption,
      location: body.location,
    },
  });

  return NextResponse.json(photo);
}
