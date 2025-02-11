import { test as base, Page, APIResponse } from "@playwright/test";
import fs from "fs";
import * as dotenv from "dotenv";
import { iQuickResSearchAPI } from "@/Interface/kuramanime/iQuickResSearchAPI";
dotenv.config();

type Kuramanime = {
	page: Page;
};

export const test = base.extend<Kuramanime>({
	page: async ({ page }, use) => {
		if (!fs.existsSync(`data`)) {
			fs.mkdirSync(`data`);
		}

		const searchResponse: APIResponse = await page.request.get(
			`${process.env.KURAMANIME_BASE_URL}/anime?search=${process.env.KURAMANIME_SEARCH_ANIME_TITLE}&need_json=true`,
		);

		const searchJSON: iQuickResSearchAPI = await searchResponse.json();

		fs.writeFileSync(`data/search.json`, JSON.stringify(searchJSON));

		use(page);
	},
});
