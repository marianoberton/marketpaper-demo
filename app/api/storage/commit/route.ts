import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { saveFileMetadata } from '@/lib/files';
import type { AllowedBucket, CommitUploadRequest, CommitUploadResponse } from '@/types/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_BUCKETS: AllowedBucket[] = ['finance-imports', 'construction-documents', 'company-logos'];
const PUBLIC_BUCKETS: AllowedBucket[] = ['company-logos'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const body: CommitUploadRequest = await request.json();
    const { bucket, path, size, mime } = body;

    // Validate bucket
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { error: 'Invalid bucket specified' },
        { status: 400 }
      );
    }

    // Validate file size
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify file exists by listing the specific path
    const fileName = path.split('/').pop();
    const folderPath = path.substring(0, path.lastIndexOf('/'));
    
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(bucket)
      .list(folderPath, {
        limit: 100,
        search: fileName,
      });

    if (listError) {
      console.error('Error verifying file existence:', listError);
      return NextResponse.json(
        { error: 'Failed to verify file upload' },
        { status: 500 }
      );
    }

    const fileExists = files?.some(file => file.name === fileName);
    if (!fileExists) {
      return NextResponse.json(
        { error: 'File not found after upload' },
        { status: 404 }
      );
    }

    // Generate public URL if bucket is public
    let publicUrl: string | undefined;
    if (PUBLIC_BUCKETS.includes(bucket)) {
      const { data: urlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(path);
      publicUrl = urlData.publicUrl;
    }

    // Save file metadata to database
    try {
      await saveFileMetadata({
        bucket,
        path,
        size,
        mime,
        url: publicUrl,
      });
    } catch (metadataError) {
      console.error('Error saving file metadata:', metadataError);
      // Don't fail the request if metadata save fails
    }

    const response: CommitUploadResponse = {
      bucket,
      path,
      publicUrl,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in commit route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}