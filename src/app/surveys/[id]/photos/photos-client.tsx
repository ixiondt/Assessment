"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Upload,
  Camera,
  X,
  Trash2,
  MapPin,
  Square,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type Annotation = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  label: string | null;
  color: string;
};

type Photo = {
  id: string;
  filename: string;
  filepath: string;
  caption: string | null;
  location: string | null;
  annotations: Annotation[];
};

export function PhotosClient({
  surveyId,
  surveyName,
  initialPhotos,
}: {
  surveyId: string;
  surveyName: string;
  initialPhotos: Photo[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [annotationMode, setAnnotationMode] = useState<
    "none" | "pin" | "rectangle"
  >("none");
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/surveys/${surveyId}/photos`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error();

        const photo = await res.json();
        setPhotos((prev) => [{ ...photo, annotations: [] }, ...prev]);
      }
      toast.success("Photo(s) uploaded");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      await fetch(`/api/surveys/${surveyId}/photos/${photoId}`, {
        method: "DELETE",
      });
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
      toast.success("Photo deleted");
    } catch {
      toast.error("Failed to delete photo");
    }
  };

  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      if (annotationMode === "none" || !selectedPhoto || !canvasRef.current)
        return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      if (annotationMode === "pin") {
        const label = prompt("Annotation label (optional):") || "";
        try {
          const res = await fetch(
            `/api/surveys/${surveyId}/photos/${selectedPhoto.id}/annotations`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "pin", x, y, label }),
            }
          );
          if (!res.ok) throw new Error();
          const annotation = await res.json();
          setSelectedPhoto((prev) =>
            prev
              ? {
                  ...prev,
                  annotations: [...prev.annotations, annotation],
                }
              : null
          );
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === selectedPhoto.id
                ? { ...p, annotations: [...p.annotations, annotation] }
                : p
            )
          );
        } catch {
          toast.error("Failed to save annotation");
        }
      } else if (annotationMode === "rectangle") {
        if (!drawStart) {
          setDrawStart({ x, y });
        } else {
          const width = Math.abs(x - drawStart.x);
          const height = Math.abs(y - drawStart.y);
          const startX = Math.min(x, drawStart.x);
          const startY = Math.min(y, drawStart.y);

          if (width > 1 && height > 1) {
            const label = prompt("Annotation label (optional):") || "";
            try {
              const res = await fetch(
                `/api/surveys/${surveyId}/photos/${selectedPhoto.id}/annotations`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "rectangle",
                    x: startX,
                    y: startY,
                    width,
                    height,
                    label,
                  }),
                }
              );
              if (!res.ok) throw new Error();
              const annotation = await res.json();
              setSelectedPhoto((prev) =>
                prev
                  ? {
                      ...prev,
                      annotations: [...prev.annotations, annotation],
                    }
                  : null
              );
              setPhotos((prev) =>
                prev.map((p) =>
                  p.id === selectedPhoto.id
                    ? { ...p, annotations: [...p.annotations, annotation] }
                    : p
                )
              );
            } catch {
              toast.error("Failed to save annotation");
            }
          }
          setDrawStart(null);
        }
      }
    },
    [annotationMode, selectedPhoto, drawStart, surveyId]
  );

  const deleteAnnotation = async (annotationId: string) => {
    if (!selectedPhoto) return;
    try {
      await fetch(
        `/api/surveys/${surveyId}/photos/${selectedPhoto.id}/annotations?annotationId=${annotationId}`,
        { method: "DELETE" }
      );
      setSelectedPhoto((prev) =>
        prev
          ? {
              ...prev,
              annotations: prev.annotations.filter(
                (a) => a.id !== annotationId
              ),
            }
          : null
      );
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === selectedPhoto.id
            ? {
                ...p,
                annotations: p.annotations.filter(
                  (a) => a.id !== annotationId
                ),
              }
            : p
        )
      );
    } catch {
      toast.error("Failed to delete annotation");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/surveys/${surveyId}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-lg">{surveyName}</h1>
              <p className="text-xs text-muted-foreground">Photos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 border border-border px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Camera</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">
                {uploading ? "Uploading..." : "Upload"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Photo detail/annotation view */}
        {selectedPhoto ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedPhoto(null);
                  setAnnotationMode("none");
                  setDrawStart(null);
                }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to gallery
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAnnotationMode(
                      annotationMode === "pin" ? "none" : "pin"
                    );
                    setDrawStart(null);
                  }}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border",
                    annotationMode === "pin"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  )}
                >
                  <MapPin className="w-4 h-4" />
                  Pin
                </button>
                <button
                  onClick={() => {
                    setAnnotationMode(
                      annotationMode === "rectangle" ? "none" : "rectangle"
                    );
                    setDrawStart(null);
                  }}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border",
                    annotationMode === "rectangle"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  )}
                >
                  <Square className="w-4 h-4" />
                  Rect
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div
              ref={canvasRef}
              className={cn(
                "relative bg-black rounded-xl overflow-hidden",
                annotationMode !== "none" && "cursor-crosshair"
              )}
              onClick={handleCanvasClick}
            >
              <Image
                src={selectedPhoto.filepath}
                alt={selectedPhoto.caption || "Photo"}
                width={1200}
                height={800}
                className="w-full h-auto"
                style={{ display: "block" }}
              />

              {/* Render annotations */}
              {selectedPhoto.annotations.map((ann) =>
                ann.type === "pin" ? (
                  <div
                    key={ann.id}
                    className="absolute group"
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      transform: "translate(-50%, -100%)",
                    }}
                  >
                    <MapPin
                      className="w-6 h-6 drop-shadow-lg"
                      style={{ color: ann.color }}
                      fill={ann.color}
                    />
                    {ann.label && (
                      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-black/80 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                        {ann.label}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnnotation(ann.id);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    key={ann.id}
                    className="absolute border-2 group"
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      width: `${ann.width}%`,
                      height: `${ann.height}%`,
                      borderColor: ann.color,
                    }}
                  >
                    {ann.label && (
                      <span
                        className="absolute -top-5 left-0 text-xs px-1 py-0.5 rounded text-white"
                        style={{ backgroundColor: ann.color }}
                      >
                        {ann.label}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnnotation(ann.id);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                )
              )}

              {/* Drawing preview for rectangle */}
              {drawStart && annotationMode === "rectangle" && (
                <div
                  className="absolute border-2 border-dashed border-red-500 pointer-events-none"
                  style={{
                    left: `${drawStart.x}%`,
                    top: `${drawStart.y}%`,
                  }}
                />
              )}
            </div>

            {annotationMode !== "none" && (
              <p className="text-xs text-muted-foreground text-center">
                {annotationMode === "pin"
                  ? "Click on the image to place a pin"
                  : drawStart
                    ? "Click to set the second corner of the rectangle"
                    : "Click to set the first corner of the rectangle"}
              </p>
            )}
          </div>
        ) : (
          /* Photo Grid */
          <>
            {photos.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2">No photos yet</h2>
                <p className="text-muted-foreground mb-4 text-sm">
                  Upload or capture photos to document findings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group bg-card border border-border rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <Image
                      src={photo.filepath}
                      alt={photo.caption || "Photo"}
                      width={400}
                      height={300}
                      className="w-full aspect-[4/3] object-cover"
                    />
                    {photo.annotations.length > 0 && (
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        {photo.annotations.length} annotations
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(photo.id);
                      }}
                      className="absolute top-2 left-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {photo.caption && (
                      <div className="p-2">
                        <p className="text-xs text-muted-foreground truncate">
                          {photo.caption}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
