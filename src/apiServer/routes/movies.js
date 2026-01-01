const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movies');
const { auth, adminAuth } = require('../auth/auth');

// Public routes
router.get('/search/:query', movieController.searchMovies);

// Authenticated user routes
router.get('/', auth, movieController.returnMovies);
router.get('/:id', movieController.getMovie);
router.post('/:id/recommend', auth, movieController.watchMovie);
router.get('/:id/recommend', auth, movieController.recommendMovies);

// Admin only routes
router.post('/', adminAuth, movieController.createMovie);
router.put('/:id', adminAuth, movieController.updateMovie);
router.delete('/:id', adminAuth, movieController.deleteMovie);

module.exports = router;
