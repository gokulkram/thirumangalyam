"use client";

import { useState, useCallback } from "react";
import { Upload, X, Star, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoFile {
  id: string;
  file?: File;
  preview: string;
  isPrimary: boolean;
}

interface PhotoUploadZoneProps {
  photos: PhotoFile[];
  maxPhotos?: number;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
}

export function PhotoUploadZone({
  photos,
  maxPhotos = 6,
  onAdd,
  onRemove,
  onSetPrimary,
}: PhotoUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const canAddMore = photos.length < maxPhotos;

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!canAddMore) return;
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      onAdd(files.slice(0, maxPhotos - photos.length));
    },
    [canAddMore, maxPhotos, photos.length, onAdd]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const files = Array.from(e.target.files);
      onAdd(files.slice(0, maxPhotos - photos.length));
      e.target.value = "";
    },
    [maxPhotos, photos.length, onAdd]
  );

  return (
    <div className="space-y-3">
      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-[3/4] rounded-[var(--radius-lg)] overflow-hidden border border-neutral-200 bg-neutral-100"
          >
            {photo.preview ? (
              <img
                src={photo.preview}
                alt="Profile photo"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-400">
                <ImagePlus className="h-8 w-8" />
              </div>
            )}
            {/* Overlay controls */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-start justify-between p-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => onSetPrimary(photo.id)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                  photo.isPrimary
                    ? "bg-secondary-500 text-white"
                    : "bg-white/80 text-neutral-600 hover:bg-secondary-500 hover:text-white"
                )}
                title={photo.isPrimary ? "Primary photo" : "Set as primary"}
              >
                <Star className="h-3.5 w-3.5" fill={photo.isPrimary ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => onRemove(photo.id)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-neutral-600 hover:bg-error hover:text-white transition-colors"
                title="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {photo.isPrimary && (
              <span className="absolute bottom-2 left-2 rounded-full bg-secondary-500 px-2 py-0.5 text-[10px] font-bold text-white">
                Primary
              </span>
            )}
          </div>
        ))}

        {/* Upload slot */}
        {canAddMore && (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed transition-colors",
              isDragging
                ? "border-primary-400 bg-primary-50"
                : "border-neutral-300 bg-neutral-50 hover:border-primary-400 hover:bg-primary-50"
            )}
          >
            <ImagePlus className={cn("h-8 w-8", isDragging ? "text-primary-500" : "text-neutral-400")} />
            <span className="text-xs font-medium text-neutral-500">Add Photo</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        )}
      </div>

      {/* Guidelines */}
      <div className="text-xs text-neutral-500 space-y-0.5">
        <p>Upload up to {maxPhotos} photos. Clear face photo required.</p>
        <p>No sunglasses, no group photos. Min 200x200px.</p>
      </div>
    </div>
  );
}
