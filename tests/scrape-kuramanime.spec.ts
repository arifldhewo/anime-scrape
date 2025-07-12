import * as dotenv from "dotenv";
import { APIResponse, test } from "@playwright/test";
import { AnimesData } from "@/Interface/kuramanime/iQuickResAPI";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { iQuickResSearchAPI } from "@/Interface/kuramanime/iQuickResSearchAPI";
import { getDay, readLatestFile } from "@/helper/Helper";
import { config } from "@/config/config";

dotenv.config();

test.describe("Kuramanime Scrape", () => {
	test("For Global Setup Running", { tag: ["@kuramanime_initiate"] }, async ({ page }) => {
		const selectedDay = parseInt(process.env.DAY);

		const readSearchJSON: Record<string, any> = JSON.parse(
			Buffer.from(readFileSync(`data/search.json`)).toString(),
		);

		const searchResponse: APIResponse = await page.request.get(
			`${config.kuramanimeBaseURL}/anime?search=${readSearchJSON.searchTitle}&need_json=true`,
		);

		const searchJSON: iQuickResSearchAPI = await searchResponse.json();

		console.log(
			`Search Keyword: `,
			searchJSON.animes.data.map((data) => data.title),
		);

		const search: iQuickResSearchAPI = JSON.parse(
			Buffer.from(readFileSync("data/searchResult.json")).toString(),
		);

		if (search.animes.data.length === 0) {
			throw new Error("Title is not found");
		}

		const dailyAnime: AnimesData[] = JSON.parse(Buffer.from(readFileSync(`data/daily.json`)).toString());

		console.log(
			`For today (${getDay(selectedDay)}) anime schedule`,
			dailyAnime.map((data) => data.title),
		);
	});

	const iniateSearch: iQuickResSearchAPI = JSON.parse(
		Buffer.from(readFileSync("data/searchResult.json")).toString(),
	);

	if (iniateSearch.animes?.data?.length !== undefined) {
		for (let i = 0; i < iniateSearch.animes.data.length; i++) {
			test(
				`Scrape anime with title ${iniateSearch.animes.data[i].title}`,
				{ tag: ["@kuramanime_search"] },
				async ({ page }) => {
					const search: iQuickResSearchAPI = JSON.parse(
						Buffer.from(readFileSync("data/searchResult.json")).toString(),
					);

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
						`${process.env.KURAMANIME_BASE_URL}/anime/${search.animes.data[i].id}/${search.animes.data[i].slug}`,
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

						const readM3U: string = Buffer.from(
							readFileSync(`outputm3u/${search.animes.data[i].slug}.m3u`),
						).toString();

						if (!readM3U.includes(`Episode ${j}`)) {
							writeFileSync(
								`outputm3u/${search.animes.data[i].slug}.m3u`,
								`\n#EXTINF:-1, ${search.animes.data[i].title} - Episode ${j}\n${srcVideoAttribute}`,
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

	const iniateDaily: AnimesData[] = JSON.parse(Buffer.from(readFileSync("data/daily.json")).toString());

	if (iniateDaily.length !== undefined) {
		for (let i = 0; i < iniateDaily.length; i++) {
			test(
				`Kuramanime TV Series Daily: ${iniateDaily[i].title}`,
				{ tag: ["@kuramanime_daily"] },
				async ({ page }) => {
					const selectedDay = parseInt(process.env.DAY);

					const daily: AnimesData[] = JSON.parse(Buffer.from(readFileSync("data/daily.json")).toString());
					let iteration: number = 0;

					if (!existsSync("outputm3u")) {
						mkdirSync("outputm3u");
					}

					if (!existsSync(`outputm3u/${getDay(selectedDay)}`)) {
						mkdirSync(`outputm3u/${getDay(selectedDay)}`);
					}

					if (!existsSync(`outputm3u/${getDay(selectedDay)}/${daily[i].slug}.m3u`)) {
						writeFileSync(`outputm3u/${getDay(selectedDay)}/${daily[i].slug}.m3u`, "#EXTM3U", { flag: "a" });
					}

					if (daily[i].image_portrait_url !== undefined) {
						const reqImage = await page.request.get(daily[i].image_portrait_url);

						const resImage = await reqImage.body();

						if (!existsSync(`outputm3u/${getDay(selectedDay)}/${daily[i].slug}.jpeg`)) {
							writeFileSync(`outputm3u/${getDay(selectedDay)}/${daily[i].slug}.jpeg`, resImage);
						}
					}

					await page.goto(`${process.env.KURAMANIME_BASE_URL}/anime/${daily[i].id}/${daily[i].slug}`, {
						waitUntil: "networkidle",
					});

					const filteredPosts = daily[i].posts.filter((data) => data.type === "Episode");
					const currentIndex = readLatestFile(daily[i].slug, selectedDay);

					if (currentIndex.length === 0) currentIndex.length = 1;

					for (let j = currentIndex.length; j <= filteredPosts.length; j++) {
						if (j > daily[i].posts.length) break;

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

						const readM3U: string = Buffer.from(
							readFileSync(`outputm3u/${getDay(selectedDay)}/${daily[i].slug}.m3u`),
						).toString();

						if (!readM3U.includes(`Episode ${j}`)) {
							writeFileSync(
								`outputm3u/${getDay(selectedDay)}/${daily[i].slug}.m3u`,
								`\n#EXTINF:-1, ${daily[i].title} - Episode ${j}\n${srcVideoAttribute}`,
								{ flag: "a" },
							);
							console.log(`anime ${daily[i].title} link for eps: ${j}\n${srcVideoAttribute}\n\n`);
						} else {
							console.log(`anime ${daily[i].title} link for eps: ${j} already created skipped writing\n\n`);
						}

						iteration += 1;
					}

					await page.close();
				},
			);
		}
	}
});
