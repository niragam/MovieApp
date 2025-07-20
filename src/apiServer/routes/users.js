const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const auth = require('../auth/auth');

router.post('/', userController.createUser);
router.get('/:id', auth, userController.getUser);
router.post('/tokens', userController.loginUser);

module.exports = router;