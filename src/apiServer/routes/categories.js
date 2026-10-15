const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categories');
const { adminAuth } = require('../auth/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validateObjectId = require('../middleware/validateObjectId');

const validId = validateObjectId('Category');

router.get('/', asyncHandler(categoryController.getCategories));
router.post('/', adminAuth, asyncHandler(categoryController.createCategory));
router.get('/:id', validId, asyncHandler(categoryController.getCategory));
router.patch('/:id', adminAuth, validId, asyncHandler(categoryController.updateCategory));
router.delete('/:id', adminAuth, validId, asyncHandler(categoryController.deleteCategory));

module.exports = router;
