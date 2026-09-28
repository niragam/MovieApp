const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movies');
const { auth, adminAuth } = require('../auth/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validateObjectId = require('../middleware/validateObjectId');

const validId = validateObjectId('Movie');

// Public routes ('/search' with no query would otherwise fall through to '/:id')
router.get('/search', movieController.rejectEmptySearch);
router.get('/search/:query', asyncHandler(movieController.searchMovies));

// Authenticated user routes
router.get('/', auth, asyncHandler(movieController.returnMovies));
router.get('/all', adminAuth, asyncHandler(movieController.getAllMovies));
router.get('/:id', validId, asyncHandler(movieController.getMovie));
router.post('/:id/recommend', auth, validId, asyncHandler(movieController.watchMovie));
router.get('/:id/recommend', auth, validId, asyncHandler(movieController.recommendMovies));

// Admin only routes
router.post('/', adminAuth, asyncHandler(movieController.createMovie));
router.put('/:id', adminAuth, validId, asyncHandler(movieController.updateMovie));
router.delete('/:id', adminAuth, validId, asyncHandler(movieController.deleteMovie));

module.exports = router;
