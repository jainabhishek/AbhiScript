import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'

// Import pages (will be created later)
import HomePage from '@/pages/HomePage'
import UploadPage from '@/pages/UploadPage'
import TranscriptsPage from '@/pages/TranscriptsPage'
import TranscriptDetailPage from '@/pages/TranscriptDetailPage'

// Import components (will be created later)
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/transcripts" element={<TranscriptsPage />} />
            <Route path="/transcripts/:recordingId" element={<TranscriptDetailPage />} />
          </Routes>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  )
}

export default App 