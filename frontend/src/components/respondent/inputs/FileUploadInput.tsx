"use client";

import React, { useRef, useState } from "react";
import { Upload, X, File as FileIcon, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { RawAnswerValue } from "@/lib/validators";

interface FileUploadInputProps {
  value: RawAnswerValue;
  onChange: (val: RawAnswerValue) => void;
  onSubmit: () => void;
  slug?: string;
  disabled?: boolean;
}

function formatBytes(bytes?: number): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function FileUploadInput({
  value,
  onChange,
  onSubmit,
  slug,
  disabled = false,
}: FileUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Parse current file value if any
  let currentFile: { file_id: number; original_name: string; size_bytes?: number } | null = null;
  if (value && typeof value === "object" && "file_id" in value) {
    currentFile = value as { file_id: number; original_name: string; size_bytes?: number };
  } else if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && "file_id" in parsed) {
        currentFile = parsed;
      }
    } catch {
      // not json
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!slug) {
      setUploadError("Form slug is missing. Cannot upload file.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const result = await api.uploadPublicFile(slug, file);
      onChange({
        file_id: result.file_id,
        original_name: result.original_name,
        size_bytes: result.size_bytes,
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setUploadError(err.message || "Upload failed. Please try again.");
      } else {
        setUploadError("Failed to upload file. Please check size and file format.");
      }
    } finally {
      setIsUploading(false);
      // Reset input value so same file can be re-selected if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentFile && !isUploading) {
        onSubmit();
      } else if (!currentFile && fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  return (
    <div
      className="w-full max-w-xl space-y-3"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="File upload"
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
        id="file-upload-input"
        aria-hidden="true"
      />

      {/* File Uploaded State */}
      {currentFile && !isUploading && (
        <div className="flex items-center justify-between p-4 rounded-[12px] bg-white/70 border border-[var(--border,#D4D2D6)] shadow-2xs transition-all">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "var(--form-button, #2B2530)",
                color: "var(--form-button-text, #FFFFFF)",
              }}
            >
              <FileIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--form-text, #2B2530)" }}
              >
                {currentFile.original_name}
              </p>
              {currentFile.size_bytes ? (
                <p className="text-xs opacity-70" style={{ color: "var(--form-text, #2B2530)" }}>
                  {formatBytes(currentFile.size_bytes)}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
            style={{ color: "var(--form-text, #2B2530)" }}
            aria-label="Remove file"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Uploading State */}
      {isUploading && (
        <div className="flex items-center justify-center gap-3 p-6 rounded-[12px] border-2 border-dashed border-[var(--border,#D4D2D6)] bg-white/40">
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: "var(--form-button, #2B2530)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--form-text, #2B2530)" }}
          >
            Uploading file...
          </span>
        </div>
      )}

      {/* Empty State / Select File */}
      {!currentFile && !isUploading && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-8 rounded-[12px] border-2 border-dashed border-[var(--border,#D4D2D6)] bg-white/40 hover:bg-white/60 transition-colors cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label="Choose file to upload"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-105"
            style={{
              backgroundColor: "var(--form-button, #2B2530)",
              color: "var(--form-button-text, #FFFFFF)",
            }}
          >
            <Upload className="w-5 h-5" />
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--form-text, #2B2530)" }}
          >
            Choose a file or drag here
          </span>
          <span
            className="text-xs opacity-65 mt-1"
            style={{ color: "var(--form-text, #2B2530)" }}
          >
            Supported documents, images, and archives
          </span>
        </div>
      )}

      {/* Upload Error Message */}
      {uploadError && (
        <p className="text-xs text-red-600 font-medium animate-in fade-in-50">
          {uploadError}
        </p>
      )}
    </div>
  );
}
