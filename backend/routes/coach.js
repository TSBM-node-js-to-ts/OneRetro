import express from "express";
import coachService from "../services/coachService.js";
import { parseErrorStatus } from "../services/utils/parseErrorStatus.js";

const router = express.Router();

router.post("/analyze", async (req, res) => {
	try {
		const { userId, reflectionId, content } = req.body ?? {};

		const result = await coachService.generateCoaching({
			userId,
			reflectionId,
			content
		});

		res.json(result);
	} catch (error) {
		res
			.status(parseErrorStatus(error, 400))
			.json({ error: error.message || "회고 코칭 분석에 실패했습니다." });
	}
});

export default router;

