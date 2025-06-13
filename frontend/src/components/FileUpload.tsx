import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface UploadedFile {
  id: string;
  filename: string;
  size: string;
  status: string;
  createdAt: string;
}

interface UploadProgress {
  percentage: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
}

const FileUpload: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ 
    percentage: 0, 
    status: 'idle' 
  });
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxSize) {
      setUploadProgress({
        percentage: 0,
        status: 'error',
        message: 'File size exceeds 500MB limit'
      });
      return;
    }

    // Create form data
    const formData = new FormData();
    formData.append('audio', file);

    setUploadProgress({ percentage: 0, status: 'uploading' });

    try {
             const response = await axios.post('http://localhost:3001/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress({ percentage, status: 'uploading' });
          }
        },
      });

      setUploadProgress({ 
        percentage: 100, 
        status: 'success',
        message: 'File uploaded successfully!' 
      });
      
      setUploadedFile(response.data.recording);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress({
        percentage: 0,
        status: 'error',
        message: axios.isAxiosError(error) && error.response?.data?.message 
          ? error.response.data.message 
          : 'Upload failed. Please try again.'
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'],
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const resetUpload = () => {
    setUploadProgress({ percentage: 0, status: 'idle' });
    setUploadedFile(null);
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : uploadProgress.status === 'error'
            ? 'border-red-300 bg-red-50'
            : uploadProgress.status === 'success'
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }
          ${uploadProgress.status === 'uploading' ? 'pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            {uploadProgress.status === 'uploading' ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            ) : uploadProgress.status === 'success' ? (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : uploadProgress.status === 'error' ? (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          {/* Upload Text */}
          <div>
            {uploadProgress.status === 'uploading' ? (
              <div>
                <p className="text-lg font-medium text-blue-600">Uploading...</p>
                <p className="text-sm text-gray-500">{uploadProgress.percentage}% complete</p>
              </div>
            ) : uploadProgress.status === 'success' ? (
              <div>
                <p className="text-lg font-medium text-green-600">Upload Complete!</p>
                <p className="text-sm text-gray-500">{uploadProgress.message}</p>
              </div>
            ) : uploadProgress.status === 'error' ? (
              <div>
                <p className="text-lg font-medium text-red-600">Upload Failed</p>
                <p className="text-sm text-red-500">{uploadProgress.message}</p>
              </div>
            ) : isDragActive ? (
              <p className="text-lg font-medium text-blue-600">Drop your audio file here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Drag & drop an audio file here, or click to select
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports MP3, WAV, M4A, AAC, OGG, FLAC, MP4, MOV (max 500MB)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {uploadProgress.status === 'uploading' && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 mb-2">File rejected:</h4>
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="text-sm text-red-600">
              <p>• {file.name} ({formatFileSize(file.size)})</p>
              {errors.map(error => (
                <p key={error.code} className="ml-4 text-red-500">
                  {error.message}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded File Info */}
      {uploadedFile && uploadProgress.status === 'success' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-green-800">File uploaded successfully!</h4>
              <div className="mt-2 text-sm text-green-700">
                <p><strong>Name:</strong> {uploadedFile.filename}</p>
                <p><strong>Size:</strong> {uploadedFile.size}</p>
                <p><strong>Status:</strong> {uploadedFile.status}</p>
                <p><strong>ID:</strong> {uploadedFile.id}</p>
              </div>
            </div>
            <button
              onClick={resetUpload}
              className="btn btn-secondary text-sm"
            >
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Error Reset */}
      {uploadProgress.status === 'error' && (
        <div className="mt-4 text-center">
          <button
            onClick={resetUpload}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 