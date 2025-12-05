import { callWorker } from "./utils/workerClient.js";

const createValidationError = (message) => {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
};

class UserService {
	#assertEmail(email) {
		if (!email) throw createValidationError("email은 필수입니다.");
	}

	async createUser({ email, name }) {
		this.#assertEmail(email);
		return callWorker("/api/users", {
			method: "POST",
			body: JSON.stringify({ email, name })
		});
	}

	async getUserByEmail(email) {
		this.#assertEmail(email);
		return callWorker(`/api/users?email=${encodeURIComponent(email)}`);
	}

	async getUserById(id) {
		if (!id) throw createValidationError("id는 필수입니다.");
		return callWorker(`/api/users/${id}`);
	}

	async updateUserName(id, name) {
		if (!id) throw createValidationError("id는 필수입니다.");
		return callWorker(`/api/users/${id}`, {
			method: "PUT",
			body: JSON.stringify({ name })
		});
	}

	/**
	 * 간단 로그인 플로우:
	 * 1) email로 조회
	 * 2) 없으면 자동 생성
	 */
	async loginOrCreate({ email, name }) {
		this.#assertEmail(email);
		try {
			const user = await this.getUserByEmail(email);
			return { user, created: false };
		} catch (err) {
			if (err?.statusCode === 404) {
				const user = await this.createUser({ email, name });
				return { user, created: true };
			}
			throw err;
		}
	}
}

const userService = new UserService();
export default userService;

