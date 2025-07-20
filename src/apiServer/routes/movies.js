const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movies');
const auth = require('../auth/auth');

router.get('/', auth, movieController.returnMovies);
router.post('/', auth, movieController.createMovie);

router.get('/:id', movieController.getMovie);
router.put('/:id', auth, movieController.updateMovie);
router.delete('/:id', auth, movieController.deleteMovie);

router.get('/:id/recommend', auth, movieController.recommendMovies);
router.post('/:id/recommend', auth, movieController.watchMovie);

router.get('/search/:query', movieController.searchMovies);

module.exports = router;