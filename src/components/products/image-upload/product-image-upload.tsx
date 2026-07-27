"use client";

import { useState, useRef } from "react";
import { Upload, X, GripVertical, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageEntry {
  url: string;
  publicId: string;
  alt?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

interface ProductImageUploadProps {
  images: ImageEntry[];
  onChange: (images: ImageEntry[]) => void;
}

export function ProductImageUpload({ images, onChange }: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      alert("Only JPEG, PNG, WebP and GIF files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File exceeds 10 MB limit.");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: dataUrl, folder: "lavisk/products" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const newImage: ImageEntry = {
        url: json.data.url,
        publicId: json.data.publicId,
        alt: "",
        isPrimary: images.length === 0,
        sortOrder: images.length,
      };
      onChange([...images, newImage]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(index: number) {
    const img = images[index];
    if (img.publicId) {
      try {
        await fetch("/api/admin/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: img.publicId }),
        });
      } catch {}
    }
    const updated = images.filter((_, i) => i !== index);
    if (img.isPrimary && updated.length > 0) updated[0].isPrimary = true;
    onChange(updated);
  }

  function setPrimary(index: number) {
    onChange(
      images.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, i) => (
          <div
            key={img.publicId || i}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-2xl border-2",
              img.isPrimary ? "border-brand" : "border-border"
            )}
          >
            <img
              src={img.url}
              alt={img.alt || ""}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setPrimary(i)}
                className="rounded-full bg-white p-1.5 shadow transition hover:scale-110"
                title="Set as primary"
              >
                <Star className={cn("h-4 w-4", img.isPrimary ? "fill-amber-400 text-amber-400" : "text-muted")} />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="rounded-full bg-white p-1.5 shadow transition hover:scale-110"
                title="Remove image"
              >
                <X className="h-4 w-4 text-destructive" />
              </button>
            </div>
            {img.isPrimary && (
              <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
                Primary
              </span>
            )}
          </div>
        ))}

        <label
          className={cn(
            "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border transition hover:border-brand hover:bg-brand-mist/30",
            uploading && "pointer-events-none opacity-50"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          {uploading ? (
            <span className="text-sm text-muted">Uploading…</span>
          ) : (
            <>
              <Upload className="mb-1 h-6 w-6 text-muted" />
              <span className="text-xs text-muted">Upload image</span>
            </>
          )}
        </label>
      </div>
    </div>
  );
}