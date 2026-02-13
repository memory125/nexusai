// Multimodal types - Support for images, audio, video, and file attachments

export type AttachmentType = 'image' | 'audio' | 'video' | 'file';

export interface Attachment {
  id: string;
  type: AttachmentType;
  name: string;
  size: number;
  mimeType: string;
  // For local files (browser)
  localUrl?: string;
  // For uploaded/remote files
  url?: string;
  // For images: dimensions
  width?: number;
  height?: number;
  // For audio/video: duration
  duration?: number;
  // Thumbnail for preview
  thumbnailUrl?: string;
  // Transcription (for audio/video)
  transcription?: string;
}

// Image-specific metadata
export interface ImageAttachment extends Attachment {
  type: 'image';
  alt?: string;
}

// Audio-specific metadata
export interface AudioAttachment extends Attachment {
  type: 'audio';
  duration: number;
  waveform?: number[];
}

// Video-specific metadata  
export interface VideoAttachment extends Attachment {
  type: 'video';
  duration: number;
  thumbnailUrl: string;
}

// Generic file attachment
export interface FileAttachment extends Attachment {
  type: 'file';
  extension: string;
}

// Message with multimodal content
export interface MultimodalMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  model?: string;
}

// Upload progress tracking
export interface UploadProgress {
  id: string;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: Attachment;
}

// Supported file types
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
];

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/m4a',
  'audio/aac',
];

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/mov',
  'video/avi',
];

export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
];

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  audio: 25 * 1024 * 1024, // 25MB  
  video: 100 * 1024 * 1024, // 100MB
  file: 50 * 1024 * 1024, // 50MB
};

// Get attachment type from mime type
export function getAttachmentType(mimeType: string): AttachmentType {
  if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) return 'image';
  if (SUPPORTED_AUDIO_TYPES.includes(mimeType)) return 'audio';
  if (SUPPORTED_VIDEO_TYPES.includes(mimeType)) return 'video';
  return 'file';
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// Check if file type is supported
export function isFileTypeSupported(mimeType: string): boolean {
  return [
    ...SUPPORTED_IMAGE_TYPES,
    ...SUPPORTED_AUDIO_TYPES,
    ...SUPPORTED_VIDEO_TYPES,
    ...SUPPORTED_DOCUMENT_TYPES,
  ].includes(mimeType);
}

// Get size limit for type
export function getSizeLimit(type: AttachmentType): number {
  return FILE_SIZE_LIMITS[type] || FILE_SIZE_LIMITS.file;
}
