import { Router, Request, Response } from 'express';
import { upload, UploadService } from '@/services/uploadService';
import { RecordingStatus } from '@/types/database';
import { logger } from '@/config/logger';
import TranscriptionService from '@/services/transcriptionService';

const router = Router();

// Upload a new recording
router.post('/', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select an audio file to upload'
      });
    }

    // Create recording record in database
    const recording = await UploadService.createRecording(
      req.file,
      req.body.userId as string | undefined // Optional user ID from request body
    );

    // Update status to processing
    await UploadService.updateRecordingStatus(
      recording.id,
      RecordingStatus.PROCESSING
    );

    logger.info(`✅ File uploaded successfully: ${req.file.originalname}`);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      recording: {
        id: recording.id,
        filename: recording.originalFilename,
        size: UploadService.formatFileSize(recording.fileSize),
        status: recording.status,
        createdAt: recording.createdAt
      }
    });
  } catch (error) {
    logger.error('Upload failed:', error);
    
    // Clean up file if it was uploaded but database record failed
    if (req.file) {
      try {
        const fs = await import('fs/promises');
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        logger.error('Failed to cleanup uploaded file:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Get upload status
router.get('/status/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recording = await UploadService.getRecording(id);

    res.json({
      success: true,
      recording: {
        id: recording.id,
        filename: recording.originalFilename,
        size: UploadService.formatFileSize(recording.fileSize),
        duration: recording.duration ? UploadService.formatDuration(recording.duration) : null,
        status: recording.status,
        createdAt: recording.createdAt,
        updatedAt: recording.updatedAt,
        hasTranscript: !!recording.transcript,
        insightsCount: recording.aiInsights?.length || 0
      }
    });
  } catch (error) {
    logger.error('Failed to get upload status:', error);
    
    if (error instanceof Error && error.message === 'Recording not found') {
      return res.status(404).json({
        error: 'Recording not found',
        message: 'The requested recording could not be found'
      });
    }

    res.status(500).json({
      error: 'Failed to get status',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Get all recordings
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const recordings = await UploadService.getAllRecordings(typeof userId === 'string' ? userId : undefined);

    const formattedRecordings = recordings.map((recording: any) => ({
      id: recording.id,
      filename: recording.originalFilename,
      size: UploadService.formatFileSize(recording.fileSize),
      duration: recording.duration ? UploadService.formatDuration(recording.duration) : null,
      status: recording.status,
      createdAt: recording.createdAt,
      updatedAt: recording.updatedAt,
      hasTranscript: !!recording.transcript,
      insightsCount: recording.aiInsights?.length || 0
    }));

    res.json({
      success: true,
      recordings: formattedRecordings,
      total: recordings.length
    });
  } catch (error) {
    logger.error('Failed to get recordings:', error);
    res.status(500).json({
      error: 'Failed to get recordings',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Delete a recording
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await UploadService.deleteRecording(id);

    res.json({
      success: true,
      message: 'Recording deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete recording:', error);
    
    if (error instanceof Error && error.message === 'Recording not found') {
      return res.status(404).json({
        error: 'Recording not found',
        message: 'The requested recording could not be found'
      });
    }

    res.status(500).json({
      error: 'Failed to delete recording',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Trigger transcription for a recording
router.post('/:id/transcribe', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: 'Recording ID is required'
      });
    }

    // Get the recording details
    const recording = await UploadService.getRecording(id);
    
    if (!recording) {
      return res.status(404).json({
        error: 'Recording not found'
      });
    }

    // Create transcription service instance
    const transcriptionService = new TranscriptionService();
    
    // Check if transcription already exists
    const existingTranscription = await transcriptionService.getTranscription(id);
    if (existingTranscription) {
      return res.status(400).json({
        error: 'Transcription already exists',
        message: 'This recording has already been transcribed'
      });
    }

    // Start transcription process
    logger.info(`Starting transcription for recording: ${id}`);
    
    // Start transcription in background
    transcriptionService.transcribeAudio(id, recording.filePath, req.body.options || {})
      .catch((error: any) => {
        logger.error(`Background transcription failed for ${id}:`, error);
      });

    res.json({
      success: true,
      message: 'Transcription started',
      recordingId: id,
      status: 'TRANSCRIBING'
    });

  } catch (error) {
    logger.error('Error starting transcription:', error);
    res.status(500).json({
      error: 'Failed to start transcription',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router; 