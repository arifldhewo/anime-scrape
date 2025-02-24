import * as dotenv from "dotenv";
import { test } from "@playwright/test";
import { AnimesData } from "@/Interface/kuramanime/iQuickResAPI";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { iQuickResSearchAPI } from "@/Interface/kuramanime/iQuickResSearchAPI";

dotenv.config();

test.describe("Kuramanime Scrape", () => {
	test("For Global Setup Running", { tag: ["@kuramanime_initiate"] }, async ({ page }) => {
		console.log("for running global setup only");

		const search: iQuickResSearchAPI = JSON.parse(
			Buffer.from(readFileSync("data/searchResult.json")).toString(),
		);

		if (search.animes.data.length === 0) {
			throw new Error("Title is not found");
		}
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

					await page.goto(
						`${process.env.KURAMANIME_BASE_URL}/anime/${search.animes.data[i].id}/${search.animes.data[i].slug}`,
						{
							waitUntil: "networkidle",
						},
					);

					for (let j = 1; j <= search.animes.data[i].posts.length; j++) {
						if (j > search.animes.data[i].posts.length) break;

						await page.locator("#episodeLists").click();

						const epsPagePromise = page.waitForEvent("popup");

						if (j === 14) {
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
							.locator("#source720")
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

					writeFileSync("data/searchResult.json", "{}");
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
					const daily: AnimesData[] = JSON.parse(Buffer.from(readFileSync("data/daily.json")).toString());

					if (!existsSync("outputm3u")) {
						mkdirSync("outputm3u");
					}

					if (!existsSync(`outputm3u/${daily[i].slug}.m3u`)) {
						writeFileSync(`outputm3u/${daily[i].slug}.m3u`, "#EXTM3U", { flag: "a" });
					}

					await page.goto(`${process.env.KURAMANIME_BASE_URL}/anime/${daily[i].id}/${daily[i].slug}`, {
						waitUntil: "networkidle",
					});

					for (let j = 1; j <= daily[i].posts.length; j++) {
						if (j > daily[i].posts.length) break;

						await page.locator("#episodeLists").click();

						const epsPagePromise = page.waitForEvent("popup");

						if (j === 14) {
							await page.locator(".fa.fa-forward").click();

							await page
								.locator(".btn.btn-sm.btn-danger.mb-1.mt-1")
								.getByText(`Ep ${j}`, { exact: true })
								.click({ timeout: 1000 * 30 });
						} else {
							await page
								.locator(".btn.btn-sm.btn-danger.mb-1.mt-1")
								.getByText(`Ep ${j}`, { exact: true })
								.click();
						}

						const epsPage = await epsPagePromise;

						const srcVideoAttribute = await epsPage
							.locator("#source720")
							.getAttribute("src", { timeout: 1000 * 30 });

						await epsPage.close();

						const readM3U: string = Buffer.from(readFileSync(`outputm3u/${daily[i].slug}.m3u`)).toString();

						if (!readM3U.includes(`Episode ${j}`)) {
							writeFileSync(
								`outputm3u/${daily[i].slug}.m3u`,
								`\n#EXTINF:-1, ${daily[i].title} - Episode ${j}\n${srcVideoAttribute}`,
								{ flag: "a" },
							);
							console.log(`anime ${daily[i].title} link for eps: ${j}\n${srcVideoAttribute}\n`);
						} else {
							console.log(`anime ${daily[i].title} link for eps: ${j} already created skipped writing`);
						}
					}

					await page.close();
				},
			);
		}
	}
});
