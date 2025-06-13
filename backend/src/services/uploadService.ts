import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/config/database';
import { RecordingStatus } from '@/types/database';
import { logger } from '@/config/logger';

const UPLOAD_DIR = process.env.UPLOAD_PATH || './uploads';
const MAX_FILE_SIZE = parseFloat(process.env.MAX_FILE_SIZE || '500') * 1024 * 1024; // Convert MB to bytes

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    logger.info(`📁 Created upload directory: ${UPLOAD_DIR}`);
  }
}

// Initialize upload directory
ensureUploadDir();

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter for audio files
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/ogg',
    'audio/webm',
    'audio/flac',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Supported types: ${allowedMimes.join(', ')}`));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

// Service functions
export class UploadService {
  static async createRecording(
    file: Express.Multer.File,
    userId?: string | undefined
  ) {
    try {
      const recording = await prisma.recording.create({
        data: {
          id: uuidv4(),
          userId,
          filename: file.filename,
          originalFilename: file.originalname,
          fileSize: file.size,
          filePath: file.path,
          status: RecordingStatus.UPLOADING,
        }
      });

      logger.info(`📄 Created recording record: ${recording.id}`);
      return recording;
    } catch (error) {
      logger.error('Failed to create recording record:', error);
      throw new Error('Failed to save recording metadata');
    }
  }

  static async updateRecordingStatus(
    recordingId: string,
    status: string,
    duration?: number
  ) {
    try {
      const recording = await prisma.recording.update({
        where: { id: recordingId },
        data: {
          status,
          duration,
          updatedAt: new Date()
        }
      });

      logger.info(`📝 Updated recording ${recordingId} status to: ${status}`);
      return recording;
    } catch (error) {
      logger.error(`Failed to update recording status:`, error);
      throw new Error('Failed to update recording status');
    }
  }

  static async getRecording(recordingId: string) {
    try {
      const recording = await prisma.recording.findUnique({
        where: { id: recordingId },
        include: {
          transcript: true,
          aiInsights: true,
        }
      });

      if (!recording) {
        throw new Error('Recording not found');
      }

      return recording;
    } catch (error) {
      logger.error(`Failed to get recording:`, error);
      throw error;
    }
  }

  static async getAllRecordings(userId?: string | undefined) {
    try {
      const recordings = await prisma.recording.findMany({
        where: userId ? { userId } : {},
        include: {
          transcript: true,
          aiInsights: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return recordings;
    } catch (error) {
      logger.error(`Failed to get recordings:`, error);
      throw new Error('Failed to retrieve recordings');
    }
  }

  static async deleteRecording(recordingId: string) {
    try {
      const recording = await prisma.recording.findUnique({
        where: { id: recordingId }
      });

      if (!recording) {
        throw new Error('Recording not found');
      }

      // Delete file from filesystem
      try {
        await fs.unlink(recording.filePath);
        logger.info(`🗑️ Deleted file: ${recording.filePath}`);
      } catch (fileError) {
        logger.warn(`Failed to delete file: ${recording.filePath}`, fileError);
      }

      // Delete from database (cascades to related records)
      await prisma.recording.delete({
        where: { id: recordingId }
      });

      logger.info(`🗑️ Deleted recording: ${recordingId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to delete recording:`, error);
      throw error;
    }
  }

  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
} 