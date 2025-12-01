import express from "express";
import reflectionsRouter from "./routes/reflections.js";
import coachRouter from "./routes/coach.js";

const app = express();

// CORS 설정
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
	if (req.method === "OPTIONS") {
		return res.sendStatus(200);
	}
	next();
});

app.use(express.json());

app.use("/api/reflections", reflectionsRouter);
app.use("/api/coach", coachRouter);

app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
