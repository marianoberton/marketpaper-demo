import type { FileMetadata } from '@/types/storage';

/**
 * Sanitizes a filename by replacing invalid characters with underscores
 * @param name - The original filename
 * @returns The sanitized filename
 */
export function sanitizeFileName(name: string): string {
  // Replace invalid characters with underscores
  // Invalid characters: < > : " | ? * \ / and control characters
  return name.replace(/[<>:"|?*\\/\x00-\x1f]/g, '_');
}

/**
 * Saves file metadata to the database
 * TODO: Implement based on your database schema
 * This is a placeholder function that should be implemented according to your needs
 * 
 * @param metadata - File metadata to save
 */
export async function saveFileMetadata(metadata: FileMetadata): Promise<void> {
  // TODO: Implement database save logic
  // Example implementation might look like:
  // 
  // const supabase = getSupabaseAdmin();
  // await supabase.from('file_uploads').insert({
  //   bucket: metadata.bucket,
  //   path: metadata.path,
  //   size: metadata.size,
  //   mime_type: metadata.mime,
  //   public_url: metadata.url,
  //   created_at: new Date().toISOString(),
  // });
  
  console.log('File metadata to save:', metadata);
  // For now, just log the metadata
  // Replace this with actual database insertion logic
}

/**
 * Generates a unique filename with timestamp prefix
 * @param originalName - The original filename
 * @returns A unique filename with timestamp
 */
export function generateUniqueFileName(originalName: string): string {
  const sanitized = sanitizeFileName(originalName);
  const timestamp = Date.now();
  return `${timestamp}_${sanitized}`;
}

/**
 * Validates file type against allowed types
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns True if file type is allowed
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validates file size against maximum allowed size
 * @param file - The file to validate
 * @param maxSize - Maximum size in bytes
 * @returns True if file size is within limit
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}