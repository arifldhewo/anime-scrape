import dotenv from "dotenv";

dotenv.config();

export const config = {
	KURAMANIME_BASE_URL: process.env.KURAMANIME_BASE_URL || "https://v8.kuramanime.tel",
	SELECTED_DAY: parseInt(process.env.DAY) || undefined,
};
