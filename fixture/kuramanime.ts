import { test as base, Page, APIResponse } from "@playwright/test";
import { iQuickResAPI } from "@/Interface/kuramanime/iQuickResAPI";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

type Kuramanime = {
	pageContext: Page;
};

const test = base.extend<Kuramanime>({
	pageContext: async ({ page }) => {
		const movieResponse: APIResponse = await page.request.get(
			`${process.env.KURAMANIME_BASE_URL}/quick/movie?order_by=updated&page=1&need_json=true`,
		);

		const movieResJSON: iQuickResAPI = await movieResponse.json();

		fs.writeFileSync(`data/movie_page_${movieResJSON.current_page}.json`, JSON.stringify(movieResJSON));

		const searchResponse: APIResponse = await page.request.get(
			`${process.env.KURAMANIME_BASE_URL}/anime?search=${process.env.SEARCH_ANIME_TITLE}&need_json=true`,
		);

		const searchJSON: iQuickResAPI = await searchResponse.json();

		const filteredAnime = searchJSON.animes.data.filter((data) => {
			const lowerCaseTitle = data.title.toLowerCase();
			const searchTitle = process.env.SEARCH_ANIME_TITLE.replaceAll("+", " ").toLowerCase();

			if (lowerCaseTitle.includes(searchTitle)) {
				return data.id;
			}
		});

		if (filteredAnime.length > 1) {
			throw new Error("Title is more have than 1 title, please make it specific");
		}

		fs.writeFileSync(`data/search_${filteredAnime[0].slug}.json`, JSON.stringify(filteredAnime));
	},
});
