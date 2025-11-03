const express = require('express');
const app = express();

app.use(express.json());

const reviewsRouter = require('./routes/reviews');
app.use('/api/reviews', reviewsRouter);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
