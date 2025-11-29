import { callWorker } from "./utils/workerClient.js";
import reflectionService from "./reflectionService.js";
import tagService from "./tags.js";
import memoryService from "./memoryService.js";

const AFFIRMATIONS = {
	positive:
		"훌륭합니다! 오늘 느낀 긍정적인 흐름을 즐기면서도, 다음 발걸음을 차분히 준비해봐요.",
	neutral:
		"차분하게 스스로를 돌아본 것이 충분히 의미 있는 한 걸음입니다. 조금만 더 구체적인 다음 행동을 정해볼까요?",
	negative:
		"어려움 속에서도 기록을 남긴 자신을 먼저 칭찬해주세요. 상황을 정리하며 작은 회복부터 시작해봐요."
};

function dominantEmotion(emotions = {}) {
	return Object.entries(emotions)
		.sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
		.map(([key, value]) => ({ name: key, score: value ?? 0 }))[0] ?? {
		name: "neutral",
		score: 0
	};
}

function buildFocusPoints(keywords = [], limit = 3) {
	if (!Array.isArray(keywords)) return [];
	return keywords
		.slice()
		.sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0))
		.slice(0, limit)
		.map((keyword) => ({
			topic: keyword.word,
			reason:
				keyword.relevance >= 0.7
					? "이번 회고에서 핵심적으로 다룬 주제예요."
					: "회고 내용에서 자주 언급된 키워드예요."
		}));
}

function buildActionItems(sentimentLabel, primaryEmotion) {
	const base = [];
	switch (sentimentLabel) {
		case "positive":
			base.push(
				"오늘 잘한 점을 구체적으로 기록하고, 같은 패턴을 반복할 방법을 정하세요.",
				"기분이 올라가 있을 때 실천하고 싶은 새로운 도전을 하나 정해보세요.",
				"작은 감사 목록을 작성해 긍정적인 에너지를 유지해보세요."
			);
			break;
		case "negative":
			base.push(
				"지금 힘든 원인을 한 문장으로 정리해보고, 통제 가능한 요소와 아닌 요소를 나눠보세요.",
				"도움을 받을 수 있는 사람이나 자원을 떠올리고, 구체적인 연락 계획을 세워보세요.",
				"오늘 할 수 있는 가장 작은 회복 행동(산책, 휴식, 대화 등)을 즉시 실행해보세요."
			);
			break;
		default:
			base.push(
				"회고에서 가장 기억에 남는 장면을 한 문장으로 요약해보세요.",
				"이번 경험에서 얻은 교훈을 다음 행동 계획과 연결지어 기록하세요.",
				"3일 이내에 확인하고 싶은 지표나 결과를 정해 알림을 설정해보세요."
			);
	}

	if (primaryEmotion.name === "fear") {
		base.push("불안을 줄이기 위해 최악의 시나리오와 그 대응 방법을 간단히 정리해보세요.");
	}
	if (primaryEmotion.name === "anger") {
		base.push("감정을 표출할 수 있는 안전한 방법(운동, 글쓰기 등)을 오늘 안에 실행해보세요.");
	}
	if (primaryEmotion.name === "sadness") {
		base.push("감정을 나눌 수 있는 사람에게 짧은 메시지를 보내보세요.");
	}

	return [...new Set(base)].slice(0, 4);
}

function buildFollowUpQuestions(sentimentLabel, primaryEmotion) {
	const questions = [
		"오늘 회고에서 가장 중요한 전환점은 무엇이었나요?",
		"이 경험을 다시 겪는다면 무엇을 동일하게, 무엇을 다르게 하실 건가요?"
	];

	if (sentimentLabel === "positive") {
		questions.push("이번 성과를 다음 목표와 연결하기 위해 필요한 준비는 무엇인가요?");
	} else if (sentimentLabel === "negative") {
		questions.push("가장 부담되는 지점은 무엇이며, 이를 덜어줄 작은 조치는 무엇일까요?");
	} else {
		questions.push("앞으로 일주일 안에 확인하고 싶은 변화는 무엇인가요?");
	}

	if (primaryEmotion.name === "joy") {
		questions.push("이 긍정적인 감정을 유지하기 위해 내일 어떤 행동을 해볼까요?");
	}
	if (primaryEmotion.name === "anger") {
		questions.push("분노를 일으킨 기준이나 기대치는 무엇이며, 그것을 조정할 필요는 없을까요?");
	}

	return [...new Set(questions)].slice(0, 4);
}

function selectAffirmation(sentimentLabel) {
	return (
		AFFIRMATIONS[sentimentLabel] ??
		AFFIRMATIONS.neutral
	);
}

async function safeCall(taskName, fn) {
	try {
		return await fn();
	} catch (error) {
		console.error(`[CoachService] ${taskName} 실패:`, error);
		return null;
	}
}

class CoachService {
	async generateCoaching({ userId, reflectionId, content }) {
		if (!content && !reflectionId) {
			const error = new Error("content 혹은 reflectionId 중 하나는 제공해야 합니다.");
			error.statusCode = 400;
			throw error;
		}

		let reflection = null;
		let existingTags = [];
		let sourceContent = content?.trim();

		if (!sourceContent) {
			if (!userId) {
				const error = new Error("reflectionId를 사용할 때는 userId도 필요합니다.");
				error.statusCode = 400;
				throw error;
			}

			reflection = await reflectionService.getReflectionById(reflectionId, userId);
			sourceContent = reflection?.content?.trim();

			if (!sourceContent) {
				const error = new Error("해당 회고에서 분석할 내용을 찾지 못했습니다.");
				error.statusCode = 404;
				throw error;
			}

			existingTags = await tagService.getTagsForReflection(reflectionId);
		}

		const memories = userId
			? await memoryService.listMemories(userId, 20)
			: [];

		const memoryContext = memories.map((item) => ({
			memory_type: item.memory_type,
			memory: item.memory,
			created_at: item.created_at,
			metadata: item.metadata
		}));

		const basePayload = {
			content: sourceContent,
			memory_context: memoryContext
		};

		const [summaryRes, sentimentRes, keywordsRes, suggestedTagsRes, fullRes] =
			await Promise.all([
				safeCall("요약 생성", () =>
					callWorker("/api/ai/summarize", {
						method: "POST",
						body: JSON.stringify({
							...basePayload,
							task_hint: "brief summary with memory context"
						})
					})
				),
				safeCall("감정 분석", () =>
					callWorker("/api/ai/analyze-sentiment", {
						method: "POST",
						body: JSON.stringify({
							...basePayload,
							task_hint: "sentiment with memory context"
						})
					})
				),
				safeCall("키워드 추출", () =>
					callWorker("/api/ai/extract-keywords", {
						method: "POST",
						body: JSON.stringify({
							...basePayload,
							task_hint: "keywords with memory context"
						})
					})
				),
				safeCall("태그 추천", () =>
					callWorker("/api/ai/suggest-tags", {
						method: "POST",
						body: JSON.stringify({
							...basePayload,
							existing_tags: existingTags.map((tag) => tag.name)
						})
					})
				),
				safeCall("종합 분석", () =>
					callWorker("/api/ai/analyze-full", {
						method: "POST",
						body: JSON.stringify({
							...basePayload,
							task_hint: "full analysis with memory context"
						})
					})
				)
			]);

		const summary = summaryRes?.summary ?? fullRes?.summary ?? null;
		const sentiment = sentimentRes?.sentiment ?? fullRes?.sentiment ?? null;
		const keywords = keywordsRes?.keywords ?? fullRes?.keywords ?? [];
		const suggestedTags =
			suggestedTagsRes?.suggested_tags ?? fullRes?.suggested_tags ?? [];

		const primaryEmotion = dominantEmotion(sentiment?.emotions);
		const sentimentLabel = sentiment?.label ?? "neutral";

		const coaching = {
			mood: {
				label: sentimentLabel,
				score: sentiment?.score ?? null,
				dominant_emotion: primaryEmotion
			},
			affirmation: selectAffirmation(sentimentLabel),
			action_items: buildActionItems(sentimentLabel, primaryEmotion),
			follow_up_questions: buildFollowUpQuestions(sentimentLabel, primaryEmotion),
			focus_points: buildFocusPoints(keywords),
			recommended_tags: suggestedTags
		};

		if (userId && summary) {
			await memoryService.createMemory({
				userId,
				memoryType: "reflection_summary",
				memory: summary,
				metadata: {
					reflectionId,
					sentiment,
					recommended_tags: suggestedTags,
					action_items: coaching.action_items
				}
			});
		}

		return {
			reflection: reflection
				? {
						id: reflection.id,
						title: reflection.title,
						reflection_date: reflection.reflection_date,
						existing_tags: existingTags
					}
				: null,
			analysis: {
				summary,
				sentiment,
				keywords,
				suggested_tags: suggestedTags
			},
			coaching
		};
	}
}

const coachService = new CoachService();
export default coachService;

