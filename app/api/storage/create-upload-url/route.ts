import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ server-only
);

export async function POST(req: Request) {
  const { bucket, path } = await req.json(); // p.ej. "construction-documents", "users/uid/2025-08-25/file.pdf"
  
  // Validar buckets permitidos
  const allowedBuckets = ['finance-imports', 'construction-documents', 'company-logos'];
  if (!allowedBuckets.includes(bucket)) {
    return NextResponse.json({ error: 'Bucket no permitido' }, { status: 400 });
  }
  
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(path);
    
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  return NextResponse.json(data); // { signedUrl, token }
}