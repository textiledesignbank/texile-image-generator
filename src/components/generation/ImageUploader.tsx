"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { useProjectPageStore } from "@/stores/useProjectPageStore";

export function ImageUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { inputImagePreview, setInputImage, clearInputImage } =
    useProjectPageStore();

  // cleanup objectURL on unmount
  useEffect(() => {
    return () => {
      if (inputImagePreview && inputImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(inputImagePreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const createThumbnail = (file: File, maxSize: number = 400): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = objectUrl;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert("50MB 이하의 이미지만 업로드할 수 있습니다.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const preview = await createThumbnail(file);
    setInputImage(file, preview);
  };

  const handleClear = () => {
    if (inputImagePreview && inputImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(inputImagePreview);
    }
    clearInputImage();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
              onClick={handleClear}
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
              <span className="text-sm text-muted-foreground">
                클릭하여 업로드
              </span>
              <span className="text-[10px] text-muted-foreground/60 block mt-1">
                최대 50MB이하 이미지만 가능
              </span>
            </div>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
