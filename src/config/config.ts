import dotenv from "dotenv";

dotenv.config();

export const config = {
	KURAMANIME_BASE_URL: process.env.KURAMANIME_BASE_URL || "https://v10.kuramanime.tel",
	SELECTED_DAY: parseInt(process.env.DAY) || undefined,
	ANIME_FILE_TEMP: process.env.ANIME_FILE_TEMP || "example.json",
};
