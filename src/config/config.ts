import dotenv from "dotenv";

dotenv.config();

export const config = {
	kuramanimeBaseURL: process.env.KURAMANIME_BASE_URL,
	kuramanimeSearchTitle: process.env.KURAMANIME_SEARCH_ANIME_TITLE,
};
