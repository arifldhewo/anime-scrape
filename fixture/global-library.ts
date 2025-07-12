import { AnimesData, iQuickResAPI } from "@/Interface/kuramanime/iQuickResAPI";
import { iQuickResSearchAPI } from "@/Interface/kuramanime/iQuickResSearchAPI";
import { config } from "@/config/config";
import { getDay } from "@/helper/Helper";
import { APIResponse, chromium } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

async function globalSetup(): Promise<void> {
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	const selectedDay = parseInt(process.env.DAY);

	if (!existsSync(`data`)) {
		mkdirSync(`data`);
	}

	writeFileSync(`data/daily.json`, "{}");
	writeFileSync(`data/searchResult.json`, "{}");

	const dailyResponse: APIResponse = await page.request.get(
		`${process.env.KURAMANIME_BASE_URL}/schedule?scheduled_day=${getDay(selectedDay)}&page=1&need_json=true`,
	);

	const dailyJSON: iQuickResAPI = await dailyResponse.json();

	let filterEps: AnimesData[];

	if (dailyJSON.animes.last_page > 1) {
		for (let i = 1; i <= dailyJSON.animes.last_page; i++) {
			const dailyResponse1: APIResponse = await page.request.get(
				`${process.env.KURAMANIME_BASE_URL}/schedule?scheduled_day=${getDay(selectedDay)}&page=${i}&need_json=true`,
			);

			const dailyJSON1: iQuickResAPI = await dailyResponse1.json();

			const filterCountry: AnimesData[] = dailyJSON1.animes.data.filter((data) => data.country_code === "JP");

			filterEps = filterCountry.filter((data) => data.posts.length <= 27);

			if (i === 1) {
				writeFileSync(`data/daily.json`, JSON.stringify(filterEps));
			} else {
				const readDailyJSON: AnimesData[] = JSON.parse(
					Buffer.from(readFileSync("data/daily.json")).toString(),
				);

				for (let i = 0; i < filterEps.length; i++) {
					readDailyJSON.push(filterEps[i]);
				}

				writeFileSync(`data/daily.json`, JSON.stringify(readDailyJSON));
			}
		}
	} else {
		const filterCountry: AnimesData[] = dailyJSON.animes.data.filter((data) => data.country_code === "JP");

		filterEps = filterCountry.filter((data) => data.posts.length <= 27);

		writeFileSync(`data/daily.json`, JSON.stringify(filterEps));
	}

	const readSearchJSON: Record<string, any> = JSON.parse(
		Buffer.from(readFileSync(`data/search.json`)).toString(),
	);

	const searchResponse: APIResponse = await page.request.get(
		`${config.kuramanimeBaseURL}/anime?search=${readSearchJSON.searchTitle}&need_json=true`,
	);

	const searchJSON: iQuickResSearchAPI = await searchResponse.json();

	writeFileSync(`data/searchResult.json`, JSON.stringify(searchJSON));
}

export default globalSetup;
