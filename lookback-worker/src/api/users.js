import { respondJSON, respondError } from "../utils/respond.js";
import { nanoid } from "../utils/nanoid.js";

export async function handleUsers(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    try {
        // ----------------------------------------
        // POST /api/users  (회원가입)
        // ----------------------------------------
        if (method === "POST" && pathname === "/api/users") {
            const body = await request.json();
            const { email, name } = body;

            if (!email) return respondError(400, "email is required");

            const userId = nanoid();

            try {
                await env.DB.prepare(
                    `INSERT INTO users (id, email, name, created_at, updated_at)
                     VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
                )
                    .bind(userId, email, name || null)
                    .run();

            } catch (err) {
                if (err.message.includes("UNIQUE")) {
                    return respondError(409, "Email already registered");
                }
                throw err;
            }

            return respondJSON({
                id: userId,
                email,
                name
            }, 201);
        }

        // ----------------------------------------
        // GET /api/users?email=xxx  (email 조회)
        // ----------------------------------------
        if (method === "GET" && pathname === "/api/users") {
            const { email } = Object.fromEntries(url.searchParams);
            if (!email) return respondError(400, "email is required");

            const user = await env.DB.prepare(
                `SELECT * FROM users WHERE email = ?`
            )
                .bind(email)
                .first();

            if (!user) return respondError(404, "User not found");

            return respondJSON(user);
        }

        // ----------------------------------------
        // GET /api/users/:id (ID 조회)
        // ----------------------------------------
        const idMatch = pathname.match(/^\/api\/users\/(.+)$/);
        if (method === "GET" && idMatch) {
            const id = idMatch[1];

            const user = await env.DB.prepare(
                `SELECT * FROM users WHERE id = ?`
            )
                .bind(id)
                .first();

            if (!user) return respondError(404, "User not found");

            return respondJSON(user);
        }

        // ----------------------------------------
        // PUT /api/users/:id  (이름 수정)
        // ----------------------------------------
        if (method === "PUT" && idMatch) {
            const id = idMatch[1];
            const body = await request.json();
            const { name } = body;

            const stmt = await env.DB.prepare(
                `UPDATE users
                 SET name = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`
            )
                .bind(name || null, id)
                .run();

            return respondJSON({ updated: stmt.changes > 0 });
        }

        return respondError(405, "Method Not Allowed");

    } catch (err) {
        console.error("User API Error:", err);
        return respondError(500, err.message || "Server Error");
    }
}
