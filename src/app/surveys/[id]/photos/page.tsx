import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PhotosClient } from "./photos-client";

export default async function PhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      photos: {
        include: { annotations: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!survey) notFound();

  return (
    <PhotosClient
      surveyId={id}
      surveyName={survey.clientName}
      initialPhotos={survey.photos}
    />
  );
}
