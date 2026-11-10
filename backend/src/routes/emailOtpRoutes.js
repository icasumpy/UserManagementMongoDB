const express = require('express');
const requireAdminAuth = require('../middleware/requireAdminAuth');
const emailOtpController = require('../controllers/emailOtpController');
const { getDatabaseStatus } = require('../config/database');

const router = express.Router();

router.use(requireAdminAuth);
router.use((_request, response, next) => {
  if (getDatabaseStatus() !== 'connected') {
    return response.status(503).json({ error: 'MongoDB is currently unavailable.' });
  }
  return next();
});
router.post('/send-otp', emailOtpController.sendOtp);
router.post('/verify-otp', emailOtpController.verifyOtp);

module.exports = router;
