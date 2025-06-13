import { Router } from 'express';

const router = Router();

// Placeholder routes - will be implemented later
router.post('/summary/:transcriptId', (req, res) => {
  res.json({ message: 'Generate summary endpoint - to be implemented' });
});

router.post('/action-items/:transcriptId', (req, res) => {
  res.json({ message: 'Generate action items endpoint - to be implemented' });
});

router.post('/q-and-a/:transcriptId', (req, res) => {
  res.json({ message: 'Q&A endpoint - to be implemented' });
});

export default router; 