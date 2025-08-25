/**
 * Allowed storage buckets in the application
 */
export type AllowedBucket = 'finance-imports' | 'construction-documents' | 'company-logos';

/**
 * Request body for signed upload URL generation
 */
export interface SignedUploadRequest {
  bucket: AllowedBucket;
  path: string;
  contentType: string;
  expiresIn?: number;
}

/**
 * Response from signed upload URL generation
 */
export interface SignedUploadResponse {
  bucket: AllowedBucket;
  path: string;
  token: string;
}

/**
 * Request body for commit upload
 */
export interface CommitUploadRequest {
  bucket: AllowedBucket;
  path: string;
  size: number;
  mime?: string;
}

/**
 * Response from commit upload
 */
export interface CommitUploadResponse {
  bucket: AllowedBucket;
  path: string;
  publicUrl?: string;
}

/**
 * File metadata for database storage
 */
export interface FileMetadata {
  bucket: AllowedBucket;
  path: string;
  size: number;
  mime?: string;
  url?: string;
}