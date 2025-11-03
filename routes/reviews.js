const express = require('express');
const router = express.Router();
const reviewService = require('../services/reviewService');

// 회고 전체 조회
router.get('/', (req, res) => {
  try {
    const reviews = reviewService.getAllReviews();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 회고 단건 조회
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const review = reviewService.getReviewById(id);
    res.json(review);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// 회고 작성
router.post('/', (req, res) => {
  try {
    const review = reviewService.createReview(req.body);
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 회고 수정
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const review = reviewService.updateReview(id, req.body);
    res.json(review);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// 회고 삭제
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    reviewService.deleteReview(id);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;

