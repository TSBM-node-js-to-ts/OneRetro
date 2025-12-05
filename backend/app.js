import express from "express";
import reflectionsRouter from "./routes/reflections.js";
import coachRouter from "./routes/coach.js";
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";
import aiRouter from "./routes/ai.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const app = express();

const swaggerSpec = swaggerJSDoc({
	definition: {
		openapi: "3.0.0",
		info: {
			title: "LookBack BFF API",
			version: "1.0.0",
			description: "Reflection CRUD & Coach proxy"
		},
		servers: [
			{
				url: "http://localhost:3000",
				description: "Local"
			}
		]
	},
	apis: ["./routes/*.js"]
});

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

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/reflections", reflectionsRouter);
app.use("/api/coach", coachRouter);
app.use("/api/ai", aiRouter);

app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
