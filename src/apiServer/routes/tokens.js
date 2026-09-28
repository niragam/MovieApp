const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const asyncHandler = require('../middleware/asyncHandler');

router.post('/', asyncHandler(userController.loginUser));

module.exports = router;
