let reviews = [];
let nextId = 1;

class ReviewModel {
  // 전체 조회
  findAll() {
    return reviews;
  }
  // ID로 조회
  findById(id) {
    return reviews.find(r => r.id === id);
  }
  // 생성
  create(data) {
    const review = {
      id: nextId++,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    reviews.push(review);
    return review;
  }
  // 수정
  update(id, data) {
    const index = reviews.findIndex(r => r.id === id);
    if (index === -1) return null;

    reviews[index] = {
      ...reviews[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    return reviews[index];
  }
  // 삭제
  delete(id) {
    const index = reviews.findIndex(r => r.id === id);
    if (index === -1) return false;

    reviews.splice(index, 1);
    return true;
  }
}

module.exports = new ReviewModel();

