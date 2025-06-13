import FileUpload from '../components/FileUpload';

const UploadPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Recording</h1>
        <p className="text-gray-600">
          Upload your audio or video files to generate transcripts with speaker identification and AI insights.
        </p>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <FileUpload />
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works:</h3>
        <div className="space-y-2 text-blue-800">
          <p>1. <strong>Upload:</strong> Drag & drop or select your audio/video file (max 500MB)</p>
          <p>2. <strong>Processing:</strong> We'll transcribe your recording using AI</p>
          <p>3. <strong>Analysis:</strong> Get speaker identification, summaries, and action items</p>
          <p>4. <strong>Results:</strong> View and export your transcript with insights</p>
        </div>
      </div>

      {/* Supported Formats */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Supported formats:</h4>
        <div className="text-sm text-gray-600">
          <p><strong>Audio:</strong> MP3, WAV, M4A, AAC, OGG, FLAC</p>
          <p><strong>Video:</strong> MP4, MOV, AVI (audio will be extracted)</p>
        </div>
      </div>
    </div>
  );
};

export default UploadPage; 