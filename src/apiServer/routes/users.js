const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const { auth } = require('../auth/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validateObjectId = require('../middleware/validateObjectId');

router.post('/', asyncHandler(userController.createUser));
router.get('/:id', auth, validateObjectId('id'), asyncHandler(userController.getUser));

module.exports = router;
