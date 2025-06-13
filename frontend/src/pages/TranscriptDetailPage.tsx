import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Copy, Download, Clock, Languages, Users, UserCheck, Sparkles, RefreshCw } from 'lucide-react';

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

interface TranscriptData {
  id: string;
  recordingId: string;
  text: string;
  segments: TranscriptSegment[];
  language: string;
  speakerCount: number;
  speakerNames?: { [key: string]: string };
  speakerIdentified?: boolean;
  confidenceScore: number | null;
  createdAt: string;
  recording: {
    id: string;
    filename: string;
    originalFilename: string;
    duration: number | null;
    status: string;
  };
}

const TranscriptDetailPage: React.FC = () => {
  const { recordingId } = useParams<{ recordingId: string }>();
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [identifyingSpeekers, setIdentifyingSpeakers] = useState(false);
  const [speakerError, setSpeakerError] = useState<string | null>(null);

  useEffect(() => {
    if (recordingId) {
      fetchTranscript();
    }
  }, [recordingId]);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/transcripts/${recordingId}`);
      console.log('Transcript data:', response.data);
      console.log('Segments:', response.data.segments);
      console.log('Speaker names:', response.data.speakerNames);
      setTranscript(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load transcript');
      console.error('Error fetching transcript:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const copyToClipboard = async () => {
    if (transcript) {
      try {
        let textToCopy = transcript.text;
        
        // If we have segments with speaker information, format it nicely
        if (transcript.segments && transcript.segments.length > 1) {
          textToCopy = transcript.segments.map(segment => {
            const speakerName = segment.speaker && transcript.speakerNames 
              ? transcript.speakerNames[segment.speaker] || segment.speaker
              : segment.speaker;
            
            const timestamp = formatTime(segment.start);
            const speaker = speakerName ? `${speakerName}: ` : '';
            
            return `[${timestamp}] ${speaker}${segment.text}`;
          }).join('\n\n');
        }
        
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const downloadTranscript = () => {
    if (transcript) {
      let textToDownload = transcript.text;
      
      // If we have segments with speaker information, format it nicely
      if (transcript.segments && transcript.segments.length > 1) {
        textToDownload = transcript.segments.map(segment => {
          const speakerName = segment.speaker && transcript.speakerNames 
            ? transcript.speakerNames[segment.speaker] || segment.speaker
            : segment.speaker;
          
          const timestamp = formatTime(segment.start);
          const speaker = speakerName ? `${speakerName}: ` : '';
          
          return `[${timestamp}] ${speaker}${segment.text}`;
        }).join('\n\n');
      }
      
      const element = document.createElement('a');
      const file = new Blob([textToDownload], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${transcript.recording.originalFilename}_transcript.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const identifySpeakers = async () => {
    if (!recordingId) return;
    
    try {
      setIdentifyingSpeakers(true);
      setSpeakerError(null);
      
      const response = await axios.post(`http://localhost:3001/api/transcripts/${recordingId}/identify-speakers`);
      
      // Refresh the transcript to get updated speaker information
      await fetchTranscript();
      
      console.log('Speaker identification completed:', response.data);
    } catch (err: any) {
      setSpeakerError(err.response?.data?.error || 'Failed to identify speakers');
      console.error('Error identifying speakers:', err);
    } finally {
      setIdentifyingSpeakers(false);
    }
  };

  const getSpeakerColor = (speaker: string): string => {
    // Generate consistent colors for speakers
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800', 
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-teal-100 text-teal-800',
      'bg-cyan-100 text-cyan-800'
    ];
    
    // Simple hash function to get consistent color for each speaker
    let hash = 0;
    for (let i = 0; i < speaker.length; i++) {
      hash = speaker.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transcript...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button onClick={fetchTranscript} className="btn btn-primary">
              Try Again
            </button>
            <Link to="/" className="btn btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Transcript not found</p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Recordings
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {transcript.recording.originalFilename}
            </h1>
            
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-4">
              {transcript.recording.duration && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDuration(transcript.recording.duration)}
                </div>
              )}
              
              <div className="flex items-center">
                <Languages className="h-4 w-4 mr-1" />
                {transcript.language.toUpperCase()}
              </div>
              
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {transcript.speakerCount} Speaker{transcript.speakerCount !== 1 ? 's' : ''}
                {transcript.speakerIdentified && (
                  <div title="Speakers identified">
                    <UserCheck className="h-4 w-4 ml-2 text-green-600" />
                  </div>
                )}
              </div>
              
              {transcript.confidenceScore && (
                <div className="flex items-center">
                  <span>Confidence: {Math.round(transcript.confidenceScore * 100)}%</span>
                </div>
              )}
            </div>
            
            {/* Speaker Error */}
            {speakerError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{speakerError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
              
              <button
                onClick={downloadTranscript}
                className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>

              {/* Speaker Identification Button */}
              {transcript.speakerCount > 1 && (
                <button
                  onClick={identifySpeakers}
                  disabled={identifyingSpeekers}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    transcript.speakerIdentified
                      ? 'bg-green-100 hover:bg-green-200 text-green-800'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  } ${identifyingSpeekers ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {identifyingSpeekers ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : transcript.speakerIdentified ? (
                    <UserCheck className="h-4 w-4 mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {identifyingSpeekers
                    ? 'Identifying...'
                    : transcript.speakerIdentified
                    ? 'Re-identify Speakers'
                    : 'Identify Speakers with AI'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Speaker Names */}
        {transcript.speakerNames && Object.keys(transcript.speakerNames).length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Identified Speakers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(transcript.speakerNames).map(([label, name]) => (
                <div
                  key={label}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${getSpeakerColor(name)}`}
                >
                  <span className="font-semibold">{label}:</span> {name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transcript Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Segments View */}
          {transcript.segments && transcript.segments.length > 1 ? (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Transcript Segments</h2>
              <div className="space-y-3">
                {transcript.segments.map((segment, index) => {
                  // Try multiple ways to get speaker name:
                  // 1. speakerName field (from backend processing)
                  // 2. speaker field with speakerNames mapping
                  // 3. Just the speaker field
                  const speakerName = (segment as any).speakerName ||
                    (segment.speaker && transcript.speakerNames 
                      ? transcript.speakerNames[segment.speaker] || segment.speaker
                      : segment.speaker);
                  
                  console.log(`Segment ${index}:`, { 
                    originalSpeaker: segment.speaker,
                    speakerName: (segment as any).speakerName,
                    finalSpeakerName: speakerName,
                    speakerNames: transcript.speakerNames 
                  });
                  
                  return (
                    <div key={index} className="flex space-x-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors rounded-md px-2">
                      <div className="flex-shrink-0 w-16 text-sm text-gray-500 font-mono pt-1">
                        {formatTime(segment.start)}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 leading-relaxed">
                          {speakerName && (
                            <span className={`inline-block px-2 py-1 rounded-md text-sm font-semibold mr-3 ${getSpeakerColor(speakerName)}`}>
                              {speakerName}:
                            </span>
                          )}
                          <span className="text-gray-800">{segment.text}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Full Text View */
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Full Transcript</h2>
              <div className="prose max-w-none">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {transcript.text}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Transcript generated on {new Date(transcript.createdAt).toLocaleDateString()} at{' '}
            {new Date(transcript.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TranscriptDetailPage; 