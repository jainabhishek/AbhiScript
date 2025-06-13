import { Router, Request, Response } from 'express';
import TranscriptionService from '../services/transcriptionService';
import SpeakerIdentificationService from '../services/speakerIdentificationService';
import { logger } from '../config/logger';

const router = Router();

// Create transcription for a recording
router.post('/', async (req: Request, res: Response) => {
  try {
    const { recordingId, filePath, options } = req.body;

    if (!recordingId || !filePath) {
      return res.status(400).json({ 
        error: 'Recording ID and file path are required' 
      });
    }

    logger.info(`Creating transcription for recording: ${recordingId}`);

    // Create transcription service instance
    const transcriptionService = new TranscriptionService();

    // Start transcription process (this will run in background)
    transcriptionService.transcribeAudio(recordingId, filePath, options)
      .catch((error: any) => {
        logger.error(`Background transcription failed for ${recordingId}:`, error);
      });

    res.json({ 
      message: 'Transcription started',
      recordingId,
      status: 'TRANSCRIBING'
    });

  } catch (error) {
    logger.error('Error starting transcription:', error);
    res.status(500).json({ 
      error: 'Failed to start transcription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all transcriptions
router.get('/', async (req: Request, res: Response) => {
  try {
    const transcriptionService = new TranscriptionService();
    const transcriptions = await transcriptionService.listTranscriptions();
    res.json(transcriptions);
  } catch (error) {
    logger.error('Error getting transcriptions:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve transcriptions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get transcription by recording ID
router.get('/:recordingId', async (req: Request, res: Response) => {
  try {
    const { recordingId } = req.params;
    
    if (!recordingId) {
      return res.status(400).json({ error: 'Recording ID is required' });
    }
    
    const transcriptionService = new TranscriptionService();
    const transcription = await transcriptionService.getTranscription(recordingId);
    
    if (!transcription) {
      return res.status(404).json({ 
        error: 'Transcription not found' 
      });
    }

    res.json(transcription);
  } catch (error) {
    logger.error('Error getting transcription:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve transcription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete transcription by recording ID
router.delete('/:recordingId', async (req: Request, res: Response) => {
  try {
    const { recordingId } = req.params;
    
    if (!recordingId) {
      return res.status(400).json({ error: 'Recording ID is required' });
    }
    
    const transcriptionService = new TranscriptionService();
    const deleted = await transcriptionService.deleteTranscription(recordingId);
    
    if (!deleted) {
      return res.status(404).json({ 
        error: 'Transcription not found' 
      });
    }

    res.json({ 
      message: 'Transcription deleted successfully',
      recordingId
    });
  } catch (error) {
    logger.error('Error deleting transcription:', error);
    res.status(500).json({ 
      error: 'Failed to delete transcription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Identify speakers for an existing transcription
router.post('/:recordingId/identify-speakers', async (req: Request, res: Response) => {
  try {
    const { recordingId } = req.params;
    
    if (!recordingId) {
      return res.status(400).json({ error: 'Recording ID is required' });
    }
    
    logger.info(`Starting speaker identification for recording: ${recordingId}`);
    
    const speakerIdentificationService = new SpeakerIdentificationService();
    const speakerMapping = await speakerIdentificationService.reIdentifySpeakers(recordingId);
    
    res.json({ 
      message: 'Speaker identification completed',
      recordingId,
      speakerMapping
    });
  } catch (error) {
    logger.error('Error identifying speakers:', error);
    res.status(500).json({ 
      error: 'Failed to identify speakers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get speaker mapping for a recording
router.get('/:recordingId/speakers', async (req: Request, res: Response) => {
  try {
    const { recordingId } = req.params;
    
    if (!recordingId) {
      return res.status(400).json({ error: 'Recording ID is required' });
    }
    
    const speakerIdentificationService = new SpeakerIdentificationService();
    const speakerMapping = await speakerIdentificationService.getSpeakerMapping(recordingId);
    
    if (!speakerMapping) {
      return res.status(404).json({ 
        error: 'Speaker mapping not found' 
      });
    }

    res.json({ 
      recordingId,
      speakerMapping
    });
  } catch (error) {
    logger.error('Error getting speaker mapping:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve speaker mapping',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 