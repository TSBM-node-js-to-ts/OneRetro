import express from 'express';
import reflectionService from '../services/reflectionService.js';
import { parseErrorStatus } from '../services/utils/parseErrorStatus.js';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Reflections
 *     description: 회고 CRUD
 */

// 회고 전체 조회
/**
 * @openapi
 * /api/reflections:
 *   get:
 *     tags: [Reflections]
 *     summary: 회고 전체 조회
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 */
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
/**
 * @openapi
 * /api/reflections/{id}:
 *   get:
 *     tags: [Reflections]
 *     summary: 회고 단건 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 */
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
/**
 * @openapi
 * /api/reflections:
 *   post:
 *     tags: [Reflections]
 *     summary: 회고 작성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, title, content]
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               reflection_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: 생성됨
 */
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
/**
 * @openapi
 * /api/reflections/{id}:
 *   put:
 *     tags: [Reflections]
 *     summary: 회고 수정
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               reflection_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: 수정됨
 */
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
/**
 * @openapi
 * /api/reflections/{id}:
 *   delete:
 *     tags: [Reflections]
 *     summary: 회고 삭제
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       204:
 *         description: 삭제됨
 */
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

export default router;