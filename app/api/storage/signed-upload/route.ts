import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { AllowedBucket, SignedUploadRequest, SignedUploadResponse } from '@/types/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_BUCKETS: AllowedBucket[] = ['finance-imports', 'construction-documents', 'company-logos'];

export async function POST(request: NextRequest) {
  try {
    const body: SignedUploadRequest = await request.json();
    const { bucket, path, contentType, expiresIn = 120 } = body;

    // Validate bucket
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { error: 'Invalid bucket specified' },
        { status: 400 }
      );
    }

    // Validate path format - must start with workspaceId/
    const pathParts = path.split('/');
    if (pathParts.length < 2 || !pathParts[0]) {
      return NextResponse.json(
        { error: 'Path must start with workspaceId/' },
        { status: 400 }
      );
    }

    // Validate expiresIn range (90-180 seconds)
    const validExpiresIn = Math.max(90, Math.min(180, expiresIn));

    const supabaseAdmin = getSupabaseAdmin();

    // Create signed upload URL
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(path, {
        upsert: false,
        expiresIn: validExpiresIn,
      });

    if (error) {
      console.error('Error creating signed upload URL:', error);
      return NextResponse.json(
        { error: 'Failed to create signed upload URL' },
        { status: 500 }
      );
    }

    const response: SignedUploadResponse = {
      bucket,
      path,
      token: data.token,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in signed-upload route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}