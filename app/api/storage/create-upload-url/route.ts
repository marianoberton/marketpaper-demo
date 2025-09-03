import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ server-only
);

export async function POST(req: Request) {
  try {
    const { bucket, path } = await req.json();
    const missing = ["bucket","path"].filter(k => !({bucket, path} as any)[k]);
    if (missing.length) return NextResponse.json(
      { error: "Faltan campos: " + missing.join(", ") }, { status: 400 });

    // Validar buckets permitidos
    const allowedBuckets = ['finance-imports', 'construction-documents', 'company-logos', 'docs'];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ error: 'Bucket no permitido: ' + bucket }, { status: 400 });
    }
    
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(path);
      
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    
    return NextResponse.json(data); // { signedUrl, token, path }
  } catch (e:any) {
    return NextResponse.json({ error: e?.message ?? "Error inesperado" }, { status: 500 });
  }
}