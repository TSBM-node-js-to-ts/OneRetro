
import { respondJSON, respondError } from "../utils/respond.js";

export async function handleDebug(request, env) {
    try {
        const rows = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
        return respondJSON({ tables: rows.results });
    } catch (err) {
        console.error("DEBUG ERROR:", err);
        return respondError(500, err.message || "DB connection error");
    }
}
