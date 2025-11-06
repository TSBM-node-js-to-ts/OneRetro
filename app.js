const express = require('express');
const { sequelize } = require('./models');
const reviewsRouter = require('./routes/reviews');

const app = express();
app.use(express.json());

sequelize.sync({force:false})
  .then(()=>{
    console.log('database 연결 성공');
  })
  .catch((err) => {
    console.error('db 연결 실패', err);
  });

app.use('/api/reviews', reviewsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
