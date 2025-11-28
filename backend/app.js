const express = require('express');
const { sequelize } = require('./models');
const reflectionsRouter = require('./routes/reflections');

const app = express();
app.use(express.json());

sequelize.sync({force:false})
  .then(()=>{
    console.log('database 연결 성공');
  })
  .catch((err) => {
    console.error('db 연결 실패', err);
  });

app.use('/api/reflections', reflectionsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
