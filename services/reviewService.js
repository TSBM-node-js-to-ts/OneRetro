const reviewModel = require('../models/review');

class ReviewService {
  // 전체 조회
  getAllReviews() {
    return reviewModel.findAll();
  }

  // 단건 조회
  getReviewById(id) {
    const review = reviewModel.findById(id);
    if (!review) {
      throw new Error('회고를 찾을 수 없습니다.');
    }
    return review;
  }

  // 생성
  createReview(data) {
    const { title, content, date } = data;

    if (!title || !content) {
      throw new Error('제목과 내용은 필수입니다.');
    }

    return reviewModel.create({
      title,
      content,
      date: date || new Date().toISOString()
    });
  }

  // 수정
  updateReview(id, data) {
    const review = reviewModel.findById(id);
    if (!review) {
      throw new Error('회고를 찾을 수 없습니다.');
    }

    const updateData = {};
    if (data.title) updateData.title = data.title;
    if (data.content) updateData.content = data.content;
    if (data.date) updateData.date = data.date;

    return reviewModel.update(id, updateData);
  }

  // 삭제
  deleteReview(id) {
    const review = reviewModel.findById(id);
    if (!review) {
      throw new Error('회고를 찾을 수 없습니다.');
    }

    reviewModel.delete(id);
    return true;
  }
}

module.exports = new ReviewService();

