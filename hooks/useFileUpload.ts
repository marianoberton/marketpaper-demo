"use client";
import { useState } from "react";
import { uploadWithSignedUrl } from "@/lib/upload";

export function useFileUpload(defaultBucket="docs") {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  async function upload(file?: File, bucket=defaultBucket) {
    setError(null);
    if (!file) { setError("Seleccioná un archivo."); throw new Error("Seleccioná un archivo."); }
    setUploading(true);
    try { return await uploadWithSignedUrl({ file, bucket }); }
    catch(e:any){ setError(e?.message ?? "Error desconocido"); throw e; }
    finally{ setUploading(false); }
  }
  return { uploading, error, upload };
}