const express = require('express');
const {
  loginAdmin,
  getAdminSession,
  logoutAdmin,
} = require('../controllers/adminAuthController');
const requireAdminAuth = require('../middleware/requireAdminAuth');

const router = express.Router();

router.post('/admin/login', loginAdmin);
router.get('/admin/me', requireAdminAuth, getAdminSession);
router.post('/admin/logout', logoutAdmin);

module.exports = router;
