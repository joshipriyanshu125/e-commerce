import express from 'express';
import { sendTestEmail } from '../controllers/debugController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send-email', protect, sendTestEmail);

export default router;
