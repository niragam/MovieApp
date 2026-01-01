const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categories');
const { auth, adminAuth } = require('../auth/auth');

router.get('/', categoryController.getCategories);
router.post('/', adminAuth, categoryController.createCategory);
router.get('/:id', categoryController.getCategory);
router.patch('/:id', adminAuth, categoryController.updateCategory);
router.delete('/:id', adminAuth, categoryController.deleteCategory);

module.exports = router;