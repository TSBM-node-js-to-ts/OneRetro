import express from "express";
import reflectionsRouter from "./routes/reflections.js";
import coachRouter from "./routes/coach.js";

const app = express();
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
