import { test as base, Page, APIResponse } from "@playwright/test";
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import * as dotenv from "dotenv";
import { iQuickResSearchAPI } from "@/Interface/kuramanime/iQuickResSearchAPI";
import { config } from "@/config/config";

type Kuramanime = {
	page: Page;
};

export const test = base.extend<Kuramanime>({
	page: async ({ page }, use) => {
		if (!existsSync(`data`)) {
			mkdirSync(`data`);
		}

		const readJSON: Record<string, any> = JSON.parse(
			Buffer.from(readFileSync(`data/search.json`)).toString(),
		);

		const searchResponse: APIResponse = await page.request.get(
			`${config.kuramanimeBaseURL}/anime?search=${readJSON.searchTitle}&need_json=true`,
		);

		const searchJSON: iQuickResSearchAPI = await searchResponse.json();

		writeFileSync(`data/searchResult.json`, JSON.stringify(searchJSON));

		use(page);
	},
});
