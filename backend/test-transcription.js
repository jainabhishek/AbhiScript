const { AssemblyAI } = require('assemblyai');
const path = require('path');
const fs = require('fs');

// Simple test script to verify AssemblyAI integration
async function testTranscription() {
  // You'll need to set your AssemblyAI API key here
  const ASSEMBLYAI_API_KEY = 'your_assemblyai_api_key_here';
  
  if (ASSEMBLYAI_API_KEY === 'your_assemblyai_api_key_here') {
    console.log('Please set your AssemblyAI API key in this script');
    return;
  }

  const client = new AssemblyAI({
    apiKey: ASSEMBLYAI_API_KEY,
  });

  // Look for the uploaded file
  const uploadsDir = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadsDir);
  console.log('Files in uploads directory:', files);

  // Find the uploaded m4a file
  const audioFile = files.find(file => file.endsWith('.m4a'));
  
  if (!audioFile) {
    console.log('No .m4a files found in uploads directory');
    return;
  }

  const filePath = path.join(uploadsDir, audioFile);
  console.log(`Testing transcription with file: ${filePath}`);

  try {
    console.log('Starting transcription...');
    const transcript = await client.transcripts.transcribe({
      audio: filePath,
      speaker_labels: true,
      auto_chapters: true,
      punctuate: true,
      format_text: true
    });

    console.log('Transcription Status:', transcript.status);
    
    if (transcript.status === 'completed') {
      console.log('Transcription Text:', transcript.text?.substring(0, 200) + '...');
      console.log('Language:', transcript.language_code);
      console.log('Audio Duration:', transcript.audio_duration, 'seconds');
      console.log('Word Count:', transcript.words?.length || 0);
    } else if (transcript.status === 'error') {
      console.log('Transcription Error:', transcript.error);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testTranscription(); 