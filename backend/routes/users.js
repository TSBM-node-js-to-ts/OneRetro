import express from "express";
import userService from "../services/userService.js";
import { parseErrorStatus } from "../services/utils/parseErrorStatus.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: 사용자 관리 및 간단 로그인
 */

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: 사용자 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *               name: { type: string }
 *     responses:
 *       201: { description: 생성됨 }
 */
router.post("/", async (req, res) => {
	try {
		const { email, name } = req.body ?? {};
		const user = await userService.createUser({ email, name });
		res.status(201).json(user);
	} catch (error) {
		res.status(parseErrorStatus(error, 400)).json({ error: error.message });
	}
});

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: 이메일로 사용자 조회
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: 성공 }
 *       404: { description: 없음 }
 */
router.get("/", async (req, res) => {
	try {
		const { email } = req.query ?? {};
		const user = await userService.getUserByEmail(email);
		res.json(user);
	} catch (error) {
		res.status(parseErrorStatus(error, 404)).json({ error: error.message });
	}
});

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: ID로 사용자 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: 성공 }
 *       404: { description: 없음 }
 */
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const user = await userService.getUserById(id);
		res.json(user);
	} catch (error) {
		res.status(parseErrorStatus(error, 404)).json({ error: error.message });
	}
});

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: 사용자 이름 수정
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200: { description: 수정됨 }
 */
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { name } = req.body ?? {};
		const result = await userService.updateUserName(id, name);
		res.json(result);
	} catch (error) {
		res.status(parseErrorStatus(error, 400)).json({ error: error.message });
	}
});

export default router;

