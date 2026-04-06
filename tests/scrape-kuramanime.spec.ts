import { APIResponse, test } from "@playwright/test";
import { AnimesData } from "@/Interface/kuramanime/iQuickResAPI";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { iQuickResSearchAPI } from "@/Interface/kuramanime/iQuickResSearchAPI";
import { getDay, readLatestFile } from "@/helper/Helper";
import { config } from "@/configs/config";
import { mode } from "@/models/config.model";

test.describe("Kuramanime Scrape", () => {
	const kuramanimeBaseURL = config.KURAMANIME_BASE_URL;
	const selectedDay = config.SELECTED_DAY;
	const fileTemp = String(config.ANIME_FILE_TEMP);

	test("For Global Setup Running", { tag: ["@kuramanime_initiate"] }, async ({ page }) => {
		console.log(selectedDay);

		if (mode.SEARCH === config.MODE) {
			const readSearchJSON: Record<string, any> = JSON.parse(readFileSync(`data/search.json`, "utf-8"));

			const searchResponse: APIResponse = await page.request.get(
				`${kuramanimeBaseURL}/anime?search=${readSearchJSON.searchTitle}&need_json=true`,
			);

			const searchJSON: iQuickResSearchAPI = await searchResponse.json();

			console.log(
				`Search Keyword: `,
				searchJSON.animes.data.map((data) => data.title),
			);

			const search: iQuickResSearchAPI = JSON.parse(readFileSync(`data/${fileTemp}`, "utf-8"));

			if (search.animes.data.length === 0) {
				throw new Error("Title is not found");
			}
		} else if (mode.DAILY === config.MODE) {
			const animeDataAnime: AnimesData[] = JSON.parse(readFileSync(`data/${fileTemp}`, "utf-8"));

			console.log(
				`For today (${getDay(selectedDay)}) anime schedule`,
				animeDataAnime.map((data) => data.title),
			);
		} else {
			const animeDataAnime: AnimesData[] = JSON.parse(readFileSync(`data/${fileTemp}`, "utf-8"));

			console.log(
				`For This Season Anime Schedule`,
				animeDataAnime.map((data) => data.title),
			);
		}
	});

	const iniateSearch: iQuickResSearchAPI = JSON.parse(readFileSync(`data/${fileTemp}`, "utf-8"));

	if (iniateSearch.animes?.data?.length !== undefined) {
		for (let i = 0; i < iniateSearch.animes.data.length; i++) {
			test(
				`Scrape anime with title ${iniateSearch.animes.data[i].title}`,
				{ tag: ["@kuramanime_search"] },
				async ({ page }) => {
					const search: iQuickResSearchAPI = JSON.parse(readFileSync(`data/${fileTemp}`, "utf-8"));

					if (!existsSync("outputm3u")) {
						mkdirSync("outputm3u");
					}

					if (!existsSync(`outputm3u/${search.animes.data[i].slug}.m3u`)) {
						writeFileSync(`outputm3u/${search.animes.data[i].slug}.m3u`, "#EXTM3U", { flag: "a" });
					}

					if (search.animes.data[i].image_portrait_url !== undefined) {
						const reqImage = await page.request.get(search.animes.data[i].image_portrait_url);

						const resImage = await reqImage.body();

						const isImgExist = existsSync(`outputm3u/${search.animes.data[i].slug}.jpeg`);

						if (!isImgExist) {
							writeFileSync(`outputm3u/${search.animes.data[i].slug}.jpeg`, resImage);
						}
					}

					await page.goto(
						`${kuramanimeBaseURL}/anime/${search.animes.data[i].id}/${search.animes.data[i].slug}`,
						{
							waitUntil: "networkidle",
						},
					);

					const filteredPosts = search.animes.data[i].posts.filter((data) => data.type === "Episode");

					for (let j = 1; j <= filteredPosts.length; j++) {
						if (j > search.animes.data[i].posts.length) break;

						await page.locator("#episodeLists").click();

						const epsPagePromise = page.waitForEvent("popup");

						if (j === 14 || j === 27) {
							await page.locator(".fa.fa-forward").click();

							await page
								.locator(".btn.btn-sm.btn-danger.mb-1.mt-1")
								.getByText(`Ep ${j}`, { exact: true })
								.click({ timeout: 1000 * 60 });
						} else {
							await page
								.locator(".btn.btn-sm.btn-danger.mb-1.mt-1")
								.getByText(`Ep ${j}`, { exact: true })
								.click();
						}

						const epsPage = await epsPagePromise;

						const srcVideoAttribute = await epsPage
							.locator('source[size="720"]')
							.getAttribute("src", { timeout: 1000 * 30 });

						await epsPage.close();

						const readM3U: string = readFileSync(`outputm3u/${search.animes.data[i].slug}.m3u`, "utf-8");

						if (!readM3U.includes(`Episode ${j}`)) {
							writeFileSync(
								`outputm3u/${search.animes.data[i].slug}.m3u`,
								`\n#EXTINF:-1, ${search.animes.data[i].title} | Episode ${j}\n${srcVideoAttribute}`,
								{ flag: "a" },
							);
							console.log(`anime ${search.animes.data[i].title} link for eps: ${j}\n${srcVideoAttribute}\n`);
						} else {
							console.log(
								`anime ${search.animes.data[i].title} link for eps: ${j} already created skipped writing`,
							);
						}
					}

					await page.close();
				},
			);
		}
	}

	const iniateDaily: AnimesData[] = JSON.parse(readFileSync(`data/${fileTemp}`, "utf-8"));

	if (iniateDaily.length !== undefined) {
		for (let i = 0; i < iniateDaily.length; i++) {
			test(
				`Kuramanime TV Series Daily: ${iniateDaily[i].title}`,
				{ tag: ["@kuramanime_daily"] },
				async ({ page }) => {
					const animeData: AnimesData[] = JSON.parse(readFileSync(`data/${fileTemp}`, "utf-8"));
					let iteration: number = 0;
					let pathPerAnime: string = `outputm3u/${animeData[i].scheduled_day}/${animeData[i].slug}`;

					if (!existsSync("outputm3u")) {
						mkdirSync("outputm3u");
					}

					if (!existsSync(`outputm3u/${animeData[i].scheduled_day}`)) {
						mkdirSync(`outputm3u/${animeData[i].scheduled_day}`);
					}

					if (!existsSync(`${pathPerAnime}.m3u`)) {
						writeFileSync(`${pathPerAnime}.m3u`, "#EXTM3U", {
							flag: "a",
						});
					}

					if (animeData[i].image_portrait_url !== undefined) {
						const reqImage = await page.request.get(animeData[i].image_portrait_url);

						const resImage = await reqImage.body();

						if (!existsSync(`${pathPerAnime}.jpeg`)) {
							writeFileSync(`${pathPerAnime}.jpeg`, resImage);
						}
					}

					await page.goto(`${kuramanimeBaseURL}/anime/${animeData[i].id}/${animeData[i].slug}`, {
						waitUntil: "networkidle",
					});

					const filteredPosts = animeData[i].posts.filter((data) => data.type === "Episode");
					const currentIndex = readLatestFile(pathPerAnime, "m3u");

					if (currentIndex.length === 0) currentIndex.length = 1;

					for (let j = currentIndex.length; j <= filteredPosts.length; j++) {
						if (j > animeData[i].posts.length) break;

						await page.locator("#episodeLists").click();

						if (iteration === 0 && j >= 27) {
							await page.locator(".fa.fa-forward").click();
							await page.locator(".fa.fa-forward").click();
						} else if ((iteration === 0 && j >= 14) || j === 14 || j === 27) {
							await page.locator(".fa.fa-forward").click();
						}
						const epsPagePromise = page.waitForEvent("popup");

						await page
							.locator(".btn.btn-sm.btn-danger.mb-1.mt-1")
							.getByText(`Ep ${j}`, { exact: true })
							.click({ timeout: 1000 * 30 });

						const epsPage = await epsPagePromise;

						const srcVideoAttribute = await epsPage
							.locator('source[size="720"]')
							.getAttribute("src", { timeout: 1000 * 30 });

						await epsPage.close();

						const readM3U: string = readFileSync(`${pathPerAnime}.m3u`, "utf-8");

						if (!readM3U.includes(`Episode ${j}`)) {
							writeFileSync(
								`${pathPerAnime}.m3u`,
								`\n#EXTINF:-1, ${animeData[i].title} | Episode ${j}\n${srcVideoAttribute}`,
								{ flag: "a" },
							);
							console.log(`anime ${animeData[i].title} link for eps: ${j}\n${srcVideoAttribute}\n\n`);
						} else {
							console.log(
								`anime ${animeData[i].title} link for eps: ${j} already created skipped writing\n\n`,
							);
						}

						iteration += 1;
					}

					await page.close();
				},
			);
		}
	}

	const iniateSeason: AnimesData[] = JSON.parse(readFileSync(`data/${fileTemp}`, "utf-8"));

	if (iniateSeason.length !== undefined) {
		for (let i = 0; i < iniateSeason.length; i++) {
			test(
				`Kuramanime TV Series Season: ${iniateSeason[i].title}`,
				{ tag: ["@kuramanime_season"] },
				async ({ page }) => {
					const animeData: AnimesData[] = JSON.parse(readFileSync(`data/${fileTemp}`, "utf-8"));
					let iteration: number = 0;
					let pathPerAnime: string = `outputm3u/${animeData[i].scheduled_day}/${animeData[i].slug}`;

					if (!existsSync("outputm3u")) {
						mkdirSync("outputm3u");
					}

					if (!existsSync(`outputm3u/${animeData[i].scheduled_day}`)) {
						mkdirSync(`outputm3u/${animeData[i].scheduled_day}`);
					}

					if (!existsSync(`${pathPerAnime}.m3u`)) {
						writeFileSync(`${pathPerAnime}.m3u`, "#EXTM3U", {
							flag: "a",
						});
					}

					if (animeData[i].image_portrait_url !== undefined) {
						const reqImage = await page.request.get(animeData[i].image_portrait_url);

						const resImage = await reqImage.body();

						if (!existsSync(`${pathPerAnime}.jpeg`)) {
							writeFileSync(`${pathPerAnime}.jpeg`, resImage);
						}
					}

					await page.goto(`${kuramanimeBaseURL}/anime/${animeData[i].id}/${animeData[i].slug}`, {
						waitUntil: "networkidle",
					});

					const filteredPosts = animeData[i].posts.filter((data) => data.type === "Episode");
					const currentIndex = readLatestFile(pathPerAnime, "m3u");

					if (currentIndex.length === 0) currentIndex.length = 1;

					for (let j = currentIndex.length; j <= filteredPosts.length; j++) {
						if (j > animeData[i].posts.length) break;

						await page.locator("#episodeLists").click();

						if (iteration === 0 && j >= 27) {
							await page.locator(".fa.fa-forward").click();
							await page.locator(".fa.fa-forward").click();
						} else if ((iteration === 0 && j >= 14) || j === 14 || j === 27) {
							await page.locator(".fa.fa-forward").click();
						}
						const epsPagePromise = page.waitForEvent("popup");

						await page
							.locator(".btn.btn-sm.btn-danger.mb-1.mt-1")
							.getByText(`Ep ${j}`, { exact: true })
							.click({ timeout: 1000 * 30 });

						const epsPage = await epsPagePromise;

						const srcVideoAttribute = await epsPage
							.locator('source[size="720"]')
							.getAttribute("src", { timeout: 1000 * 30 });

						await epsPage.close();

						const readM3U: string = readFileSync(`${pathPerAnime}.m3u`, "utf-8");

						if (!readM3U.includes(`Episode ${j}`)) {
							writeFileSync(
								`${pathPerAnime}.m3u`,
								`\n#EXTINF:-1, ${animeData[i].title} | Episode ${j}\n${srcVideoAttribute}`,
								{ flag: "a" },
							);
							console.log(`anime ${animeData[i].title} link for eps: ${j}\n${srcVideoAttribute}\n\n`);
						} else {
							console.log(
								`anime ${animeData[i].title} link for eps: ${j} already created skipped writing\n\n`,
							);
						}

						iteration += 1;
					}

					await page.close();
				},
			);
		}
	}
});
