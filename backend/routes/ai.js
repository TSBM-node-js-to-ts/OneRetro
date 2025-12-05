import express from "express";
import aiService from "../services/aiService.js";
import { parseErrorStatus } from "../services/utils/parseErrorStatus.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: AI
 *     description: AI 관련 기능 프록시 (Worker 연동)
 */

const wrap = (handler) => async (req, res) => {
	try {
		const result = await handler(req);
		res.json(result);
	} catch (error) {
		res.status(parseErrorStatus(error, 400)).json({ error: error.message });
	}
};

/**
 * @openapi
 * /api/ai/generate-title:
 *   post:
 *     tags: [AI]
 *     summary: 제목 자동 생성
 */
router.post("/generate-title", wrap((req) => aiService.generateTitle(req.body)));

/**
 * @openapi
 * /api/ai/summarize:
 *   post:
 *     tags: [AI]
 *     summary: 요약
 */
router.post("/summarize", wrap((req) => aiService.summarize(req.body)));

/**
 * @openapi
 * /api/ai/analyze-sentiment:
 *   post:
 *     tags: [AI]
 *     summary: 감정 분석
 */
router.post("/analyze-sentiment", wrap((req) => aiService.analyzeSentiment(req.body)));

/**
 * @openapi
 * /api/ai/extract-keywords:
 *   post:
 *     tags: [AI]
 *     summary: 키워드 추출
 */
router.post("/extract-keywords", wrap((req) => aiService.extractKeywords(req.body)));

/**
 * @openapi
 * /api/ai/suggest-tags:
 *   post:
 *     tags: [AI]
 *     summary: 태그 추천
 */
router.post("/suggest-tags", wrap((req) => aiService.suggestTags(req.body)));

/**
 * @openapi
 * /api/ai/analyze-full:
 *   post:
 *     tags: [AI]
 *     summary: 종합 분석
 */
router.post("/analyze-full", wrap((req) => aiService.analyzeFull(req.body)));

/**
 * @openapi
 * /api/ai/chat:
 *   post:
 *     tags: [AI]
 *     summary: RAG 챗봇 (refs/메모리 포함)
 */
router.post("/chat", wrap((req) => aiService.chat(req.body)));

/**
 * @openapi
 * /api/tags/generate:
 *   post:
 *     tags: [AI]
 *     summary: 간단 태그 자동 생성
 */
router.post("/../tags/generate", wrap((req) => aiService.generateTagsSimple(req.body)));

export default router;

