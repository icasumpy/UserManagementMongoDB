const express = require('express');
const requireAdminAuth = require('../middleware/requireAdminAuth');
const userController = require('../controllers/userController');
const { getDatabaseStatus } = require('../config/database');

const router = express.Router();

router.use(requireAdminAuth);
router.use((_request, response, next) => {
  if (getDatabaseStatus() !== 'connected') {
    return response.status(503).json({ error: 'MongoDB is currently unavailable.' });
  }
  return next();
});
router.get('/', userController.listUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
