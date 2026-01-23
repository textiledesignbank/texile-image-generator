"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value?: string;
  onChange: (base64: string | undefined) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | undefined>(value);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onChange(base64);
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
  });

  const handleRemove = () => {
    setPreview(undefined);
    onChange(undefined);
  };

  if (preview) {
    return (
      <div className="relative">
        <img
          src={preview}
          alt="Uploaded"
          className="w-full h-64 object-contain rounded-lg border bg-muted"
        />
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        {isDragActive ? (
          <>
            <Upload className="h-10 w-10 text-primary" />
            <p className="text-sm text-primary">이미지를 놓으세요</p>
          </>
        ) : (
          <>
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              이미지를 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP (최대 10MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
