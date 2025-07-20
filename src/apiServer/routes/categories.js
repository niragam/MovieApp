const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categories');
const auth = require('../auth/auth');

router.get('/', categoryController.getCategories);
router.post('/', auth, categoryController.createCategory);
router.get('/:id', categoryController.getCategory);
router.patch('/:id', auth, categoryController.updateCategory);
router.delete('/:id', auth, categoryController.deleteCategory);

module.exports = router;