import express from "express";
import userService from "../services/userService.js";
import { parseErrorStatus } from "../services/utils/parseErrorStatus.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: 이메일 기반 간단 로그인
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: 이메일 로그인 (없으면 자동 생성)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *               name: { type: string, description: "신규 생성 시 표시 이름" }
 *     responses:
 *       200: { description: 기존 사용자 로그인 }
 *       201: { description: 신규 생성 후 로그인 }
 */
router.post("/login", async (req, res) => {
	try {
		const { email, name } = req.body ?? {};
		const { user, created } = await userService.loginOrCreate({ email, name });
		res.status(created ? 201 : 200).json(user);
	} catch (error) {
		res.status(parseErrorStatus(error, 400)).json({ error: error.message });
	}
});

export default router;

