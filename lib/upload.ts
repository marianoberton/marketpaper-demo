import { supabase } from "./supabaseClient";

const slug = (s:string)=>s.toLowerCase().replace(/[^a-z0-9.\-]+/g,"-").replace(/^-+|-+$/g,"");

async function buildPath(file: File) {
  const { data: { user } } = await supabase.auth.getUser();
  const uid = user?.id ?? "anon";
  return `users/${uid}/${Date.now()}-${slug(file.name)}`;
}

export async function uploadWithSignedUrl(params: { file: File; bucket: string; path?: string; }) {
  const { file, bucket } = params;
  if (!file)  throw new Error("Falta file.");
  if (!bucket) throw new Error("Falta bucket.");
  const path = params.path ?? await buildPath(file);

  const res = await fetch("/api/storage/create-upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ bucket, path })
  });
  if (!res.ok) {
    const j = await res.json().catch(()=>({}));
    throw new Error("No se pudo firmar: " + (j.error ?? res.statusText));
  }
  const { token } = await res.json();
  if (!token) throw new Error("Respuesta inválida: falta token.");

  const { data, error } = await supabase.storage.from(bucket)
    .uploadToSignedUrl(path, token, file);
  if (error) throw new Error("Supabase: " + error.message);

  return { bucket, path, data };
}