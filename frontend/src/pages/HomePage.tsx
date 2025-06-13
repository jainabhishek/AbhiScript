import { Link } from 'react-router-dom';
import { Upload, FileText, BarChart3 } from 'lucide-react';
import RecordingsList from '../components/RecordingsList';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="text-blue-600">AbhiScript</span>
            <br />
            
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Upload your call recordings and get accurate transcripts with speaker identification,
            summaries, and action items powered by OpenAI technology.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Built by Abhishek Jain for Branders
          </p>
          <div className="mt-8">
            <Link
              to="/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 inline-flex items-center space-x-2"
            >
              <Upload className="h-5 w-5" />
              <span>Upload Recording</span>
            </Link>
          </div>
        </div>

        {/* Recent Recordings */}
        <div className="mb-16">
          <RecordingsList />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-blue-600 mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Accurate Transcription
            </h3>
            <p className="text-gray-600">
              Get high-quality transcripts with speaker identification using OpenAI Whisper API.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-blue-600 mb-4">
              <BarChart3 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI Analysis
            </h3>
            <p className="text-gray-600">
              Generate summaries, action items, and insights from your call transcripts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-blue-600 mb-4">
              <Upload className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Easy Upload
            </h3>
            <p className="text-gray-600">
              Support for various audio formats with simple drag-and-drop interface.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-600 mb-6">
            Upload your first call recording and experience the power of AI transcription.
          </p>
          <Link
            to="/upload"
            className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-2 px-6 rounded-lg border border-blue-600 transition duration-200"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 