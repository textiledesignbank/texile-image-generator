"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { useProjectPageStore } from "@/stores/useProjectPageStore";

export function ImageUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { inputImagePreview, setInputImage, clearInputImage } = useProjectPageStore();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setInputImage(base64, base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Upload className="h-4 w-4" />
          입력 이미지
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        {inputImagePreview ? (
          <div className="relative">
            <img
              src={inputImagePreview}
              alt="Input"
              className="w-full max-h-48 object-contain rounded-md bg-muted"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={clearInputImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-32"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">클릭하여 업로드</span>
            </div>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
