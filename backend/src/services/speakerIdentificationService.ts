import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export interface SpeakerMapping {
  [speakerLabel: string]: string; // e.g., "Speaker A": "John Smith"
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

class SpeakerIdentificationService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for speaker identification');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID,
    });
  }

  /**
   * Identify speakers using GPT-4.1 based on transcript content and context
   */
  async identifySpeakers(
    recordingId: string,
    segments: TranscriptSegment[],
    rawTranscript: string
  ): Promise<SpeakerMapping> {
    try {
      logger.info(`Starting speaker identification for recording ${recordingId}`);

      // Prepare the transcript with speaker labels for analysis
      const speakerSegments = this.prepareSpeakerSegments(segments);
      
      // Create the prompt for GPT-4.1
      const prompt = this.createSpeakerIdentificationPrompt(speakerSegments, rawTranscript);

      // Call GPT-4.1 for speaker identification
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-1106-preview', // GPT-4 Turbo
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing meeting transcripts and identifying speakers based on context, conversation flow, and content patterns. You should identify real names when mentioned and create consistent speaker labels.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent results
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from GPT-4.1');
      }

      // Parse the JSON response
      const speakerMapping: SpeakerMapping = JSON.parse(result);
      
      // Store the speaker mapping in the database
      await this.storeSpeakerMapping(recordingId, speakerMapping);

      logger.info(`Speaker identification completed for recording ${recordingId}:`, speakerMapping);
      return speakerMapping;

    } catch (error) {
      logger.error(`Speaker identification failed for recording ${recordingId}:`, error);
      throw error;
    }
  }

  /**
   * Prepare speaker segments for analysis
   */
  private prepareSpeakerSegments(segments: TranscriptSegment[]): string {
    return segments
      .slice(0, 50) // Analyze first 50 segments for performance
      .map((segment, index) => {
        const speaker = segment.speaker || `Speaker ${String.fromCharCode(65 + (index % 10))}`;
        const timeStamp = this.formatTimestamp(segment.start);
        return `[${timeStamp}] ${speaker}: ${segment.text}`;
      })
      .join('\n');
  }

  /**
   * Create the GPT-4.1 prompt for speaker identification
   */
  private createSpeakerIdentificationPrompt(speakerSegments: string, rawTranscript: string): string {
    return `
Analyze this meeting transcript and identify the real names of the speakers. Look for:

1. Direct name mentions (when people introduce themselves or others)
2. Context clues about roles, companies, or titles
3. Speaking patterns and conversation flow
4. Email signatures or contact information mentioned

Here's the transcript with speaker labels:

${speakerSegments}

Additional context from full transcript:
${rawTranscript.slice(0, 2000)}...

Please return a JSON object mapping speaker labels to real names. Use this format:
{
  "Speaker A": "John Smith",
  "Speaker B": "Jane Doe",
  "Speaker C": "Mike Johnson"
}

Guidelines:
- Use full names when available (e.g., "John Smith" not "John")
- If a name isn't clearly mentioned, use a descriptive identifier (e.g., "Burberry Representative", "Ship Code Demo Lead")
- Be consistent with speaker labels throughout
- If uncertain about a name, use role/company instead (e.g., "Burberry Product Manager")
- Return only the JSON object, no additional text

JSON Response:`;
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Store speaker mapping in database
   */
  private async storeSpeakerMapping(recordingId: string, speakerMapping: SpeakerMapping): Promise<void> {
    try {
      await prisma.transcript.update({
        where: { recordingId },
        data: {
          speakerNames: JSON.stringify(speakerMapping),
          speakerIdentified: true,
          updatedAt: new Date()
        }
      });

      logger.info(`Speaker mapping stored for recording ${recordingId}`);
    } catch (error) {
      logger.error(`Failed to store speaker mapping for recording ${recordingId}:`, error);
      throw error;
    }
  }

  /**
   * Get speaker mapping for a recording
   */
  async getSpeakerMapping(recordingId: string): Promise<SpeakerMapping | null> {
    try {
      const transcript = await prisma.transcript.findUnique({
        where: { recordingId },
        select: { speakerNames: true, speakerIdentified: true }
      });

      if (!transcript?.speakerNames) {
        return null;
      }

      return JSON.parse(transcript.speakerNames) as SpeakerMapping;
    } catch (error) {
      logger.error(`Failed to get speaker mapping for recording ${recordingId}:`, error);
      return null;
    }
  }

  /**
   * Apply speaker names to transcript segments
   */
  async applySpeakerNamesToSegments(
    recordingId: string,
    segments: TranscriptSegment[]
  ): Promise<TranscriptSegment[]> {
    const speakerMapping = await this.getSpeakerMapping(recordingId);
    
    if (!speakerMapping) {
      return segments;
    }

    return segments.map(segment => ({
      ...segment,
      speaker: speakerMapping[segment.speaker || ''] || segment.speaker
    }));
  }

  /**
   * Re-identify speakers for an existing transcript
   */
  async reIdentifySpeakers(recordingId: string): Promise<SpeakerMapping> {
    try {
      // Get existing transcript
      const transcript = await prisma.transcript.findUnique({
        where: { recordingId }
      });

      if (!transcript) {
        throw new Error('Transcript not found');
      }

      const segments = JSON.parse(transcript.content) as TranscriptSegment[];
      
      // Re-run identification
      return await this.identifySpeakers(recordingId, segments, transcript.rawTranscript);
    } catch (error) {
      logger.error(`Failed to re-identify speakers for recording ${recordingId}:`, error);
      throw error;
    }
  }
}

export default SpeakerIdentificationService; 