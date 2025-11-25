const express = require('express');
const router = express.Router();
const reflectionService = require('../services/reflectionService');

function parseErrorStatus(error, defaultStatus = 500) {
  return error?.statusCode && Number.isInteger(error.statusCode)
    ? error.statusCode
    : defaultStatus;
}

// 회고 전체 조회
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const reflections = await reflectionService.getAllReflections(userId);
    res.json(reflections);
  } catch (error) {
    res
      .status(parseErrorStatus(error, 400))
      .json({ error: error.message || "회고 목록을 불러오지 못했습니다." });
  }
});

// 회고 단건 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    const reflection = await reflectionService.getReflectionById(
      Number(id),
      userId
    );
    res.json(reflection);
  } catch (error) {
    res
      .status(parseErrorStatus(error, 404))
      .json({ error: error.message || "회고를 찾을 수 없습니다." });
  }
});

// 회고 작성
router.post('/', async (req, res) => {
  try {
    const { userId, ...payload } = req.body;
    const reflection = await reflectionService.createReflection(
      userId,
      payload
    );
    res.status(201).json(reflection);
  } catch (error) {
    res
      .status(parseErrorStatus(error, 400))
      .json({ error: error.message || "회고를 생성하지 못했습니다." });
  }
});

// 회고 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, ...payload } = req.body;
    const reflection = await reflectionService.updateReflection(
      Number(id),
      userId,
      payload
    );
    res.json(reflection);
  } catch (error) {
    res
      .status(parseErrorStatus(error, 404))
      .json({ error: error.message || "회고를 수정하지 못했습니다." });
  }
});

// 회고 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    await reflectionService.deleteReflection(Number(id), userId);
    res.status(204).send();
  } catch (error) {
    res
      .status(parseErrorStatus(error, 404))
      .json({ error: error.message || "회고를 삭제하지 못했습니다." });
  }
});

module.exports = router;

