import dotenv from "dotenv";

dotenv.config();

const shared = {
	username: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME,
	host: process.env.DB_HOST,
	dialect: process.env.DB_DIALECT
};

const config = {
	development: { ...shared },
	test: { ...shared },
	production: { ...shared }
};

export default config;
