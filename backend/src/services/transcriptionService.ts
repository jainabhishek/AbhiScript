import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';
import SpeakerIdentificationService from './speakerIdentificationService';

const prisma = new PrismaClient();

export interface TranscriptionResult {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }>;
  language: string;
  duration: number;
  speakerCount?: number;
}

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
}

class TranscriptionService {
  private assemblyai: AssemblyAI;
  private speakerIdentificationService?: SpeakerIdentificationService;

  constructor() {
    if (!process.env.ASSEMBLYAI_API_KEY) {
      throw new Error('ASSEMBLYAI_API_KEY environment variable is required');
    }

    this.assemblyai = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY,
    });
    
    // Initialize speaker identification service if OpenAI key is available
    try {
      this.speakerIdentificationService = new SpeakerIdentificationService();
    } catch (error) {
      logger.warn('Speaker identification disabled: OpenAI API key not configured');
    }
  }

  /**
   * Main transcription method that handles files of any size
   */
  async transcribeAudio(
    recordingId: string,
    filePath: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    try {
      logger.info(`Starting transcription for recording ${recordingId}`);
      
      // Update recording status to transcribing
      await this.updateRecordingStatus(recordingId, 'TRANSCRIBING');

      // Check file size for logging
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;

      logger.info(`File size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

      // AssemblyAI handles file sizes automatically
      const transcriptionResult = await this.transcribeDirectly(filePath, options);

      // Store the transcription in database
      await this.storeTranscription(recordingId, transcriptionResult);

      // Identify speakers using GPT-4.1 if available
      if (this.speakerIdentificationService && transcriptionResult.speakerCount && transcriptionResult.speakerCount > 1) {
        try {
          logger.info(`Identifying speakers for recording ${recordingId}...`);
          await this.speakerIdentificationService.identifySpeakers(
            recordingId,
            transcriptionResult.segments,
            transcriptionResult.text
          );
          logger.info(`Speaker identification completed for recording ${recordingId}`);
        } catch (error) {
          logger.warn(`Speaker identification failed for recording ${recordingId}:`, error);
          // Don't fail the whole transcription if speaker identification fails
        }
      }

      // Update recording status to completed
      await this.updateRecordingStatus(recordingId, 'COMPLETED');

      logger.info(`Transcription completed for recording ${recordingId}`);
      return transcriptionResult;

    } catch (error) {
      logger.error(`Transcription failed for recording ${recordingId}:`, error);
      await this.updateRecordingStatus(recordingId, 'FAILED');
      throw error;
    }
  }

  /**
   * Direct transcription using AssemblyAI API
   */
  private async transcribeDirectly(
    filePath: string,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    try {
      logger.info('Sending file to AssemblyAI API...');
      
      // Use AssemblyAI transcribe with proper params object
      const transcript = await this.assemblyai.transcripts.transcribe({
        audio: filePath,
        speaker_labels: true,
        auto_chapters: true,
        punctuate: true,
        format_text: true
      });

      if (transcript.status === 'error') {
        throw new Error(`AssemblyAI transcription failed: ${transcript.error}`);
      }

      // Get audio duration
      const duration = await this.getAudioDuration(filePath);

      // Parse response to match our interface with speaker information
      const segments = this.parseAssemblyAISegmentsWithSpeakers(transcript);
      
      // Count unique speakers
      const speakerSet = new Set(segments.map(s => s.speaker).filter(Boolean));
      const speakerCount = speakerSet.size;

      return {
        text: transcript.text || '',
        segments,
        language: transcript.language_code || 'unknown',
        duration: transcript.audio_duration || duration,
        speakerCount
      };

    } catch (error) {
      logger.error('AssemblyAI transcription failed:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse segments from AssemblyAI response with speaker information
   */
  private parseAssemblyAISegmentsWithSpeakers(transcript: any): Array<{ start: number; end: number; text: string; speaker?: string }> {
    logger.info('Parsing AssemblyAI segments:', {
      hasUtterances: !!(transcript.utterances && Array.isArray(transcript.utterances)),
      hasWords: !!(transcript.words && Array.isArray(transcript.words)),
      utteranceCount: transcript.utterances?.length || 0,
      wordCount: transcript.words?.length || 0,
      firstUtterance: transcript.utterances?.[0],
      firstWord: transcript.words?.[0]
    });

    if (transcript.utterances && Array.isArray(transcript.utterances)) {
      // Use utterances which include speaker labels
      logger.info('Using utterances for segments');
      const segments = transcript.utterances.map((utterance: any) => {
        const segment: { start: number; end: number; text: string; speaker?: string } = {
          start: utterance.start / 1000, // Convert ms to seconds
          end: utterance.end / 1000,
          text: utterance.text || ''
        };
        if (utterance.speaker) {
          segment.speaker = `Speaker ${utterance.speaker}`;
        }
        return segment;
      });
      logger.info(`Created ${segments.length} segments from utterances, first segment:`, segments[0]);
      return segments;
    }
    
    if (transcript.words && Array.isArray(transcript.words)) {
      // Group words into sentences/segments for better readability with speaker info
      const segments: Array<{ start: number; end: number; text: string; speaker?: string }> = [];
      let currentSegment = '';
      let segmentStart = 0;
      let currentSpeaker: string | undefined;
      
      for (let i = 0; i < transcript.words.length; i++) {
        const word = transcript.words[i];
        
        if (i === 0) {
          segmentStart = word.start / 1000;
          currentSpeaker = word.speaker ? `Speaker ${word.speaker}` : undefined;
        }
        
        // Check if speaker changed
        const wordSpeaker = word.speaker ? `Speaker ${word.speaker}` : undefined;
        const speakerChanged = wordSpeaker !== currentSpeaker;
        
        currentSegment += word.text + ' ';
        
                 // End segment on speaker change, sentence boundaries, or every ~50 words
         if (speakerChanged || word.text.match(/[.!?]$/) || (i > 0 && i % 50 === 0) || i === transcript.words.length - 1) {
           const segment: { start: number; end: number; text: string; speaker?: string } = {
             start: segmentStart,
             end: word.end / 1000,
             text: currentSegment.trim()
           };
           if (currentSpeaker) {
             segment.speaker = currentSpeaker;
           }
           segments.push(segment);
          
          if (speakerChanged) {
            currentSpeaker = wordSpeaker;
            segmentStart = word.start / 1000;
            currentSegment = word.text + ' ';
          } else {
            currentSegment = '';
            if (i < transcript.words.length - 1) {
              segmentStart = transcript.words[i + 1]?.start / 1000 || 0;
              currentSpeaker = transcript.words[i + 1]?.speaker ? `Speaker ${transcript.words[i + 1].speaker}` : undefined;
            }
          }
        }
      }
      
      return segments;
    }
    
    // If no word-level data, create a single segment for the entire text
    return [{
      start: 0,
      end: transcript.audio_duration || 0,
      text: transcript.text || ''
    }];
  }

  /**
   * Get audio file duration using ffmpeg
   */
  private async getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          logger.error('Error getting audio duration:', err);
          // Return 0 if we can't get duration, rather than failing
          resolve(0);
          return;
        }
        
        const duration = metadata?.format?.duration;
        resolve(duration || 0);
      });
    });
  }

  /**
   * Store transcription result in database
   */
  private async storeTranscription(recordingId: string, result: TranscriptionResult): Promise<void> {
    try {
      await prisma.transcript.create({
        data: {
          recordingId,
          content: JSON.stringify(result.segments),
          rawTranscript: result.text,
          speakerCount: result.speakerCount || 1,
          confidenceScore: null, // Will be calculated when we have confidence data
          language: result.language
        }
      });

      // Update recording with duration if not already set
      if (result.duration > 0) {
        await prisma.recording.update({
          where: { id: recordingId },
          data: { 
            duration: result.duration 
          }
        });
      }

      logger.info(`Transcription stored for recording ${recordingId}`);
    } catch (error) {
      logger.error(`Failed to store transcription for recording ${recordingId}:`, error);
      throw error;
    }
  }

  /**
   * Update recording status in database
   */
  private async updateRecordingStatus(recordingId: string, status: string): Promise<void> {
    try {
      await prisma.recording.update({
        where: { id: recordingId },
        data: { status }
      });
      logger.info(`Updated recording ${recordingId} status to ${status}`);
    } catch (error) {
      logger.error(`Failed to update recording status for ${recordingId}:`, error);
      throw error;
    }
  }

  /**
   * Get transcription by recording ID
   */
  async getTranscription(recordingId: string) {
    try {
      const transcript = await prisma.transcript.findUnique({
        where: { recordingId },
        include: {
          recording: true
        }
      });

      if (!transcript) {
        return null;
      }

      let segments = JSON.parse(transcript.content);
      let speakerNames = null;

      // Parse speaker names if available
      if ((transcript as any).speakerNames) {
        try {
          speakerNames = JSON.parse((transcript as any).speakerNames);
          logger.info(`Speaker names found for recording ${recordingId}:`, speakerNames);
        } catch (error) {
          logger.warn(`Failed to parse speaker names for recording ${recordingId}:`, error);
        }
      }

      // Apply speaker names to segments if available
      if (speakerNames && segments.length > 0) {
        logger.info('Applying speaker names to segments');
        segments = segments.map((segment: any) => ({
          ...segment,
          speakerName: segment.speaker && speakerNames[segment.speaker] 
            ? speakerNames[segment.speaker] 
            : segment.speaker
        }));
      }

      // Log segment data for debugging
      logger.info(`Segments for recording ${recordingId}:`, {
        segmentCount: segments.length,
        firstSegment: segments[0],
        hasSpeakerNames: !!speakerNames,
        firstSegmentSpeaker: segments[0]?.speaker,
        firstSegmentSpeakerName: segments[0]?.speakerName
      });

      return {
        id: transcript.id,
        recordingId: transcript.recordingId,
        text: transcript.rawTranscript,
        segments,
        language: transcript.language,
        speakerCount: transcript.speakerCount,
        speakerNames,
        speakerIdentified: (transcript as any).speakerIdentified,
        confidenceScore: transcript.confidenceScore,
        createdAt: transcript.createdAt,
        recording: {
          id: transcript.recording.id,
          filename: transcript.recording.filename,
          originalFilename: transcript.recording.originalFilename,
          duration: transcript.recording.duration,
          status: transcript.recording.status
        }
      };
    } catch (error) {
      logger.error(`Failed to get transcription for recording ${recordingId}:`, error);
      throw error;
    }
  }

  /**
   * Delete transcription
   */
  async deleteTranscription(recordingId: string): Promise<boolean> {
    try {
      await prisma.transcript.delete({
        where: { recordingId }
      });
      
      logger.info(`Transcription deleted for recording ${recordingId}`);
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Record not found
        return false;
      }
      logger.error(`Failed to delete transcription for recording ${recordingId}:`, error);
      throw error;
    }
  }

  /**
   * List all transcriptions
   */
  async listTranscriptions() {
    try {
      const transcripts = await prisma.transcript.findMany({
        include: {
          recording: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return transcripts.map(transcript => ({
        id: transcript.id,
        recordingId: transcript.recordingId,
        text: transcript.rawTranscript.substring(0, 200) + '...', // Truncated preview
        language: transcript.language,
        speakerCount: transcript.speakerCount,
        confidenceScore: transcript.confidenceScore,
        createdAt: transcript.createdAt,
        recording: {
          id: transcript.recording.id,
          filename: transcript.recording.filename,
          originalFilename: transcript.recording.originalFilename,
          duration: transcript.recording.duration,
          status: transcript.recording.status
        }
      }));
    } catch (error) {
      logger.error('Failed to list transcriptions:', error);
      throw error;
    }
  }
}

export default TranscriptionService; 