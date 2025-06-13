import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Recording {
  id: string;
  filename: string;
  size: string;
  duration: string | null;
  status: string;
  createdAt: string;
  hasTranscript: boolean;
  insightsCount: number;
}

const RecordingsList: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcribingIds, setTranscribingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/upload');
      setRecordings(response.data.recordings);
      setError(null);
    } catch (err) {
      setError('Failed to load recordings');
      console.error('Error fetching recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  const startTranscription = async (recordingId: string) => {
    try {
      setTranscribingIds(prev => new Set(prev).add(recordingId));
      
      const response = await axios.post(`http://localhost:3001/api/upload/${recordingId}/transcribe`);
      
      if (response.data.success) {
        // Update the recording status locally
        setRecordings(prev => prev.map(recording => 
          recording.id === recordingId 
            ? { ...recording, status: 'TRANSCRIBING' }
            : recording
        ));
        
        // Start polling for status updates
        pollTranscriptionStatus(recordingId);
      }
    } catch (err: any) {
      console.error('Error starting transcription:', err);
      alert(err.response?.data?.error || 'Failed to start transcription');
      setTranscribingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordingId);
        return newSet;
      });
    }
  };

  const pollTranscriptionStatus = async (recordingId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/upload/status/${recordingId}`);
        const recording = response.data.recording;
        
        if (recording.status === 'COMPLETED' || recording.status === 'FAILED') {
          clearInterval(pollInterval);
          setTranscribingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(recordingId);
            return newSet;
          });
          
          // Refresh the recordings list
          fetchRecordings();
        }
      } catch (err) {
        console.error('Error polling status:', err);
        clearInterval(pollInterval);
        setTranscribingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(recordingId);
          return newSet;
        });
      }
    }, 3000); // Poll every 3 seconds
    
    // Clear polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setTranscribingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordingId);
        return newSet;
      });
    }, 600000);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'transcribing': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading recordings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchRecordings}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2C7 1.44772 7.44772 1 8 1H16C16.5523 1 17 1.44772 17 2V4M7 4H17M7 4L5.5 21H18.5L17 4M10 9V17M14 9V17" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No recordings yet</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by uploading your first audio file.</p>
        
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Recent Recordings</h3>
        <button 
          onClick={fetchRecordings}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {recordings.map((recording) => (
          <div key={recording.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {recording.filename}
                </h4>
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  <span>{recording.size}</span>
                  {recording.duration && <span>{recording.duration}</span>}
                  <span>{formatDate(recording.createdAt)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Status Badge */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(recording.status)}`}>
                  {recording.status}
                </span>
                
                {/* Transcript Indicator */}
                {recording.hasTranscript && (
                  <div className="flex items-center text-green-600" title="Transcript available">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v4H7V5zm2 6v2H7v-2h2z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* Insights Count */}
                {recording.insightsCount > 0 && (
                  <div className="flex items-center text-blue-600" title={`${recording.insightsCount} insights`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="ml-1 text-xs">{recording.insightsCount}</span>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {/* Transcribe Button */}
                  {!recording.hasTranscript && recording.status !== 'TRANSCRIBING' && recording.status !== 'FAILED' && (
                    <button 
                      onClick={() => startTranscription(recording.id)}
                      disabled={transcribingIds.has(recording.id)}
                      className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
                      title="Start transcription"
                    >
                      {transcribingIds.has(recording.id) ? (
                        <div className="flex items-center space-x-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                          <span>Starting...</span>
                        </div>
                      ) : (
                        'Transcribe'
                      )}
                    </button>
                  )}
                  
                  {/* View Transcript Button */}
                  {recording.hasTranscript && (
                    <button 
                      onClick={() => window.location.href = `/transcripts/${recording.id}`}
                      className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
                      title="View transcript"
                    >
                      View Transcript
                    </button>
                  )}
                  
                  <button className="p-1 text-gray-400 hover:text-gray-600" title="View details">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecordingsList; 