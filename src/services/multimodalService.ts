// Multimodal Service - Handles file uploads for images, audio, video, and files

import {
  Attachment,
  getAttachmentType,
  getSizeLimit,
} from '../types/multimodal';

class MultimodalService {
  /**
   * Process files from input element
   */
  async processFiles(files: FileList | File[]): Promise<Attachment[]> {
    const results: Attachment[] = [];

    for (const file of Array.from(files)) {
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Validate file size
      const type = getAttachmentType(file.type);
      const maxSize = getSizeLimit(type);
      if (file.size > maxSize) {
        console.warn(`File ${file.name} exceeds size limit`);
        continue;
      }

      // Create attachment from file
      try {
        const attachment = await this.createAttachmentFromFile(file, uploadId);
        results.push(attachment);
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Create attachment from File object
   */
  private async createAttachmentFromFile(file: File, uploadId: string): Promise<Attachment> {
    const type = getAttachmentType(file.type);
    const attachment: Attachment = {
      id: uploadId,
      type,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      localUrl: URL.createObjectURL(file),
    };

    // Get dimensions for images
    if (type === 'image') {
      try {
        const dimensions = await this.getImageDimensions(attachment.localUrl!);
        attachment.width = dimensions.width;
        attachment.height = dimensions.height;
      } catch {
        // Ignore dimension errors
      }
    }

    // Get duration for audio/video
    if (type === 'audio' || type === 'video') {
      try {
        const duration = await this.getMediaDuration(attachment.localUrl!, type);
        attachment.duration = duration;
        
        // Generate thumbnail for video
        if (type === 'video') {
          attachment.thumbnailUrl = await this.generateVideoThumbnail(attachment.localUrl!);
        }
      } catch {
        // Ignore duration errors
      }
    }

    return attachment;
  }

  /**
   * Get image dimensions
   */
  private getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = url;
    });
  }

  /**
   * Get media duration
   */
  private getMediaDuration(url: string, type: 'audio' | 'video'): Promise<number> {
    return new Promise((resolve) => {
      const media = type === 'audio' ? new Audio() : document.createElement('video');
      media.onloadedmetadata = () => resolve(media.duration);
      media.onerror = () => resolve(0);
      media.src = url;
    });
  }

  /**
   * Generate thumbnail for video
   */
  private generateVideoThumbnail(url: string): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.currentTime = 1;
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve('');
        }
      };
      video.onerror = () => resolve('');
      video.src = url;
      video.muted = true;
    });
  }

  /**
   * Start voice recording
   */
  async startVoiceRecording(): Promise<{ stop: () => void; audio: HTMLAudioElement }> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.start();

    const audio = new Audio();
    
    const stop = () => {
      mediaRecorder.stop();
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        audio.src = URL.createObjectURL(blob);
      }
      stream.getTracks().forEach(track => track.stop());
    };

    return { stop, audio };
  }

  /**
   * Clean up object URLs to prevent memory leaks
   */
  cleanup(attachments: Attachment[]): void {
    attachments.forEach(attachment => {
      if (attachment.localUrl && attachment.localUrl.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.localUrl);
      }
      if (attachment.thumbnailUrl && attachment.thumbnailUrl.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.thumbnailUrl);
      }
    });
  }
}

// Singleton instance
export const multimodalService = new MultimodalService();

export default multimodalService;
