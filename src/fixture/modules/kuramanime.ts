import { AnimesData, iQuickResAPI } from "@/Interface/kuramanime/iQuickResAPI";
import { iQuickResSearchAPI } from "@/Interface/kuramanime/iQuickResSearchAPI";
import { config } from "@/configs/config";
import { getDay } from "@/helper/Helper";
import { APIResponse, Page } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { mode } from "@/models/config.model";

export async function kuramanimeInit(page: Page) {
	const selectedDay = config.SELECTED_DAY;
	const kuramanimeBaseURL = config.KURAMANIME_BASE_URL;
	const fileTemp = config.ANIME_FILE_TEMP;
	const cookie =
		"should_do_galak=hide; sel_timezone_v2=Asia/Bangkok; auto_timezone_v2=yes; full_timezone_v2=+07; short_timezone_v2=+07; XSRF-TOKEN=eyJpdiI6IlpXTEdSUWdlOUMvdDV1Q2s3OGdYbUE9PSIsInZhbHVlIjoibmJTNVBhNytXMHdGODQvSlNhUFY4emNTQ0htc0VqMXdBVWJqVDJkVEdxTFR0Uk5Kb2czU3hjT2FiUGtHcTI3anZEZExEMzR6aGgxQ0FnazZNbWlqUEY5d0MyQUZxNG83MTIwTnZ0ZkZrOXdZaTNhUTNlWmR6S1lBQnQ3aXpka1giLCJtYWMiOiI2MWY5ZTkwNTFiOWMyYjlmOTRhYWZhNWVmNWVlOTU3NDU1OWEzZGQ4MzE2YWI1MjQ3ZTM2Mzk5MDRhZDIwYzcyIiwidGFnIjoiIn0%3D; preferred_stserver=kuramadrive; kuramanime_session=eyJpdiI6IjllSDAxM0tMV0VjcitxVTF4TUgvdFE9PSIsInZhbHVlIjoiT05DQjJyRFY4cTNKV0FYcTNZME9BM2l1MjdLQ0JrSHNLbDJsT3FlVXZrYkxYVWJrK0RvZDhTRzVKbkZjbHhaeUFzOEhQbHk2dDNPQjlNRXVsL1ZLS3hZMnFMc0p4eVF4YUltN0tPTGdUalI2RFVVVTFBMXRiL0lqbFJjd0gwNTQiLCJtYWMiOiI1OGMyYTA2MmUxODdiNzI0ZGU1MzVmYWY4OWFkYmU1YWE1YTQwYzlmZTk5ZWRmMWIxOTk1NTNhNGI5ZmFjYmU1IiwidGFnIjoiIn0%3D";

	if (!existsSync(`data`)) {
		mkdirSync(`data`);
	}

	await Promise.all([
		getdaily(selectedDay, page, kuramanimeBaseURL, fileTemp, cookie),
		getSearch(page, fileTemp, kuramanimeBaseURL, cookie),
		getCurrentSeason(page, fileTemp, kuramanimeBaseURL, cookie),
	]);
}

async function getdaily(
	selectedDay: number | undefined,
	page: Page,
	kuramanimeBaseURL: string,
	fileTemp: string,
	cookie: string,
	actualMode: string = config.MODE,
) {
	if (actualMode !== mode.DAILY) {
		return;
	}

	const dailyResponse: APIResponse = await page.request.get(
		`${kuramanimeBaseURL}/schedule?scheduled_day=${getDay(selectedDay)}&page=1&need_json=true`,
		{
			headers: {
				Cookie: cookie,
			},
		},
	);

	const dailyJSON: iQuickResAPI = await dailyResponse.json();

	let filterEps: AnimesData[];

	if (dailyJSON.animes.last_page > 1) {
		for (let i = 1; i <= dailyJSON.animes.last_page; i++) {
			const dailyResponse1: APIResponse = await page.request.get(
				`${kuramanimeBaseURL}/schedule?scheduled_day=${getDay(selectedDay)}&page=${i}&need_json=true`,
			);

			const dailyJSON1: iQuickResAPI = await dailyResponse1.json();

			const filterCountry: AnimesData[] = dailyJSON1.animes.data.filter((data) => data.country_code === "JP");

			filterEps = filterCountry.filter((data) => data.posts.length <= 27);

			if (i === 1) {
				writeFileSync(`data/${fileTemp}`, JSON.stringify(filterEps));
			} else {
				const readDailyJSON: AnimesData[] = JSON.parse(readFileSync(`data/${fileTemp}`, "utf-8"));

				for (let i = 0; i < filterEps.length; i++) {
					readDailyJSON.push(filterEps[i]);
				}

				writeFileSync(`data/${fileTemp}`, JSON.stringify(readDailyJSON));
			}
		}
	} else {
		const filterCountry: AnimesData[] = dailyJSON.animes.data.filter((data) => data.country_code === "JP");

		filterEps = filterCountry.filter((data) => data.posts.length <= 27);

		writeFileSync(`data/${fileTemp}`, JSON.stringify(filterEps));
	}
}

async function getSearch(
	page: Page,
	fileTemp: string,
	kuramanimeBaseURL: string,
	cookie: string,
	actualMode: string = config.MODE,
) {
	if (actualMode !== mode.SEARCH) {
		return;
	}

	const readSearchJSON: Record<string, any> = JSON.parse(readFileSync(`data/search.json`, "utf-8"));

	const searchResponse: APIResponse = await page.request.get(
		`${kuramanimeBaseURL}/anime?search=${readSearchJSON.searchTitle}&need_json=true`,
		{
			headers: {
				Cookie: cookie,
			},
		},
	);

	const searchJSON: iQuickResSearchAPI = await searchResponse.json();

	writeFileSync(`data/${fileTemp}`, JSON.stringify(searchJSON));
}

async function getCurrentSeason(
	page: Page,
	fileTemp: string,
	kuramanimeBaseURL: string,
	cookie: string,
	actualMode: string = config.MODE,
) {
	if (actualMode !== mode.SEASON) {
		return;
	}

	let URLPath: string = `${kuramanimeBaseURL}/schedule?scheduled_day=text&need_json=true`;

	const getCurrentSeason = await page.request.get(URLPath, {
		headers: {
			Cookie: cookie,
		},
		params: {
			page: 1,
		},
	});

	const currentSeasonJSON: iQuickResAPI = await getCurrentSeason.json();

	let filterEps: AnimesData[];

	if (currentSeasonJSON.animes.last_page > 1) {
		for (let i = 1; i <= currentSeasonJSON.animes.last_page; i++) {
			const currentSeasonResponse: APIResponse = await page.request.get(URLPath, {
				headers: {
					Cookie: cookie,
				},
				params: {
					page: i,
				},
			});

			const currentSeasonJSON1: iQuickResAPI = await currentSeasonResponse.json();

			const filterCountry: AnimesData[] = currentSeasonJSON1.animes.data.filter(
				(data) => data.country_code === "JP",
			);

			filterEps = filterCountry.filter((data) => data.posts.length <= 27);

			if (i === 1) {
				writeFileSync(`data/${fileTemp}`, JSON.stringify(filterEps));
			} else {
				const readDailyJSON: AnimesData[] = JSON.parse(readFileSync(`data/${fileTemp}`, "utf-8"));

				for (let i = 0; i < filterEps.length; i++) {
					readDailyJSON.push(filterEps[i]);
				}

				writeFileSync(`data/${fileTemp}`, JSON.stringify(readDailyJSON));
			}
		}
	} else {
		const filterCountry: AnimesData[] = currentSeasonJSON.animes.data.filter(
			(data) => data.country_code === "JP",
		);

		filterEps = filterCountry.filter((data) => data.posts.length <= 27);

		writeFileSync(`data/${fileTemp}`, JSON.stringify(filterEps));
	}
}
