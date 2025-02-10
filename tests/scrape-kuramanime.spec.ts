import * as dotenv from "dotenv";
import test, { APIResponse } from "@playwright/test";
import { iQuickResAPI } from "@/Interface/kuramanime/iQuickResAPI";
import fs, { existsSync } from "fs";

dotenv.config();

test.describe("Kuramanime Scrape", () => {
	test(
		`Scrape anime with title ${process.env.KURAMANIME_SEARCH_ANIME_TITLE}`,
		{ tag: ["@kuramanime_search"] },
		async ({ page }) => {
			if (!existsSync("outputm3u")) {
				fs.mkdirSync("outputm3u");
			}

			const searchResponse: APIResponse = await page.request.get(
				`${process.env.KURAMANIME_BASE_URL}/anime?search=${process.env.KURAMANIME_SEARCH_ANIME_TITLE}&need_json=true`,
			);

			const searchJSON: iQuickResAPI = await searchResponse.json();

			const filteredAnime = searchJSON.animes.data.filter((data) => {
				const searchTitle = process.env.KURAMANIME_SEARCH_ANIME_TITLE.replaceAll("+", "-").toLowerCase();

				if (data.slug.includes(searchTitle)) {
					return data;
				}
			});

			if (filteredAnime.length > 1) {
				throw new Error("Title is more have than 1 title, please make it specific");
			}

			if (filteredAnime.length === 0) {
				throw new Error("Title not found");
			}

			if (!fs.existsSync(`outputm3u/${filteredAnime[0].slug}.m3u`)) {
				fs.writeFileSync(`outputm3u/${filteredAnime[0].slug}.m3u`, "#EXTM3U", { flag: "a" });
			}

			await page.goto(
				`${process.env.KURAMANIME_BASE_URL}/anime/${filteredAnime[0].id}/${filteredAnime[0].slug}`,
				{ waitUntil: "networkidle" },
			);

			for (let i = 1; i <= filteredAnime[0].posts.length; i++) {
				await page.locator("#episodeLists").click();

				const epsPagePromise = page.waitForEvent("popup");

				if (i === 14) {
					await page.locator(".fa.fa-forward").click();

					await page
						.locator(".btn.btn-sm.btn-danger.mb-1.mt-1")
						.getByText(`Ep ${i}`, { exact: true })
						.click({ timeout: 1000 * 30 });
				} else {
					await page
						.locator(".btn.btn-sm.btn-danger.mb-1.mt-1")
						.getByText(`Ep ${i}`, { exact: true })
						.click();
				}

				const epsPage = await epsPagePromise;

				const srcVideoAttribute = await epsPage
					.locator("#source720")
					.getAttribute("src", { timeout: 1000 * 30 });

				await epsPage.close();

				const readM3U: string = Buffer.from(
					fs.readFileSync(`outputm3u/${filteredAnime[0].slug}.m3u`),
				).toString();

				if (!readM3U.includes(`Episode ${i}`)) {
					fs.writeFileSync(
						`outputm3u/${filteredAnime[0].slug}.m3u`,
						`\n#EXTINF:-1, ${filteredAnime[0].title} - Episode ${i}\n${srcVideoAttribute}`,
						{ flag: "a" },
					);
					console.log(`save video link for eps: ${i}\n${srcVideoAttribute}\n`);
				} else {
					console.log(`video link for eps: ${i} already created skipped writing`);
				}
			}

			await page.close();
		},
	);

	test("Kuramanime TV Series Daily", { tag: ["@kuramanime_daily"] }, async ({ page }) => {
		if (!existsSync("outputm3u")) {
			fs.mkdirSync("outputm3u");
		}

		const response = await page.request.get(
			`${process.env.KURAMANIME_BASE_URL}/quick/ongoing?order_by=updated&page=1&need_json=true`,
		);

		const resJSON: iQuickResAPI = await response.json();

		const filteredAnimeByJapan = resJSON.animes.data.filter((data) => data.country_code === "JP");

		const filteredAnimeByLatestEpsLessThan24 = filteredAnimeByJapan.filter(
			(data) => data.latest_episode <= 24,
		);

		await page.goto(`${process.env.KURAMANIME_BASE_URL}`);

		await page.getByText("Lihat Semua").first().click();

		for (let i = 0; i < filteredAnimeByLatestEpsLessThan24.length; i++) {
			if (!fs.existsSync(`outputm3u/${filteredAnimeByLatestEpsLessThan24[i].slug}.m3u`)) {
				fs.writeFileSync(`outputm3u/${filteredAnimeByLatestEpsLessThan24[i].slug}.m3u`, "#EXTM3U", {
					flag: "a",
				});
			}

			const fileM3U: string = Buffer.from(
				fs.readFileSync(`outputm3u/${filteredAnimeByLatestEpsLessThan24[i].slug}.m3u`),
			).toString();

			if (fileM3U.includes(`Episode ${filteredAnimeByLatestEpsLessThan24[i].latest_episode}`)) {
				console.log(
					"Gk Lanjut Eksekusi untuk title: ",
					filteredAnimeByLatestEpsLessThan24[i].title,
					" Because it's already created",
				);
			} else {
				console.log("Lanjut Eksekusi untuk title: ", filteredAnimeByLatestEpsLessThan24[i].title);

				const detailPagePromise = page.waitForEvent("popup");

				await page
					.getByText(`${filteredAnimeByLatestEpsLessThan24[i].title}`, { exact: true })
					.first()
					.click();

				const detailPage = await detailPagePromise;

				const srcVideoAttribute = await detailPage
					.locator("#source720")
					.getAttribute("src", { timeout: 1000 * 30 });

				await detailPage.close();

				fs.appendFileSync(
					`outputm3u/${filteredAnimeByLatestEpsLessThan24[i].slug}.m3u`,
					`\n#EXTINF:-1, ${filteredAnimeByLatestEpsLessThan24[i].title} - Episode ${filteredAnimeByLatestEpsLessThan24[i].latest_episode}\n${srcVideoAttribute}`,
					{ flag: "a" },
				);
				console.log(
					`save video link for eps: ${filteredAnimeByLatestEpsLessThan24[i].latest_episode}\n${srcVideoAttribute}\n`,
				);
			}
		}
		await page.close();
	});
});
