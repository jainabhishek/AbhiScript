import { Router } from 'express';

const router = Router();

// Placeholder routes - will be implemented later
router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - to be implemented' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - to be implemented' });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout endpoint - to be implemented' });
});

export default router; 