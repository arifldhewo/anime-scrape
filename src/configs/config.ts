import dotenv from "dotenv";

dotenv.config();

export const config = {
	KURAMANIME_BASE_URL: process.env.KURAMANIME_BASE_URL || "https://v18.kuramanime.ing",
	SELECTED_DAY: Number(process.env.DAY) || undefined,
	ANIME_FILE_TEMP: process.env.ANIME_FILE_TEMP || "example.json",
	MODE: process.env.MODE || "season", // daily, season, search
};