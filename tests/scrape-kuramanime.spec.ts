import * as dotenv from "dotenv";
import test, { APIResponse } from "@playwright/test";
import { iQuickResAPI } from "@/Interface/kuramanime/iQuickResAPI";
import fs from "fs";

dotenv.config();

test.describe("Kuramanime Scrape", () => {
	test(
		`Scrape anime with title ${process.env.KURAMANIME_SEARCH_ANIME_TITLE}`,
		{ tag: ["@kuramanime_search"] },
		async ({ page }) => {
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

			fs.writeFileSync(`data/${filteredAnime[0].slug}.m3u`, "#EXTM3U", { flag: "a" });

			await page.goto(
				`${process.env.KURAMANIME_BASE_URL}/anime/${filteredAnime[0].id}/${filteredAnime[0].slug}`,
				{ waitUntil: "networkidle" },
			);

			for (let i = 1; i <= filteredAnime[0].posts.length; i++) {
				await page.locator("#episodeLists").click();

				const epsPagePromise = page.waitForEvent("popup");

				await page.locator(".btn.btn-sm.btn-danger.mb-1.mt-1").getByText(`Ep ${i}`, { exact: true }).click();

				const epsPage = await epsPagePromise;

				const srcVideoAttribute = await epsPage
					.locator("#source720")
					.getAttribute("src", { timeout: 1000 * 30 });

				console.log("SrcVideoAttribute: ", srcVideoAttribute);

				await epsPage.close();

				fs.writeFileSync(
					`data/${filteredAnime[0].slug}.m3u`,
					`
#EXTINF:-1, ${filteredAnime[0].title} - Episode ${i}
${srcVideoAttribute}
`,
					{ flag: "a" },
				);
			}

			await page.close();
		},
	);

	test("Kuramanime TV Series Daily", { tag: ["@kuramanime_daily"] }, async ({ page }) => {
		const response = await page.request.get(
			`${process.env.KURAMANIME_BASE_URL}/quick/ongoing?order_by=updated&page=1&need_json=true`,
		);

		const resJSON: iQuickResAPI = await response.json();

		const filteredAnimeByJapan = resJSON.animes.data.filter((data) => data.country_code === "JP");

		const filteredAnimeByTotalEpsLessThan24 = filteredAnimeByJapan.filter(
			(data) => data.total_episodes <= 24,
		);

		const filteredAnimeByLatestEpsLessThan24 = filteredAnimeByTotalEpsLessThan24.filter(
			(data) => data.latest_episode <= 24,
		);

		console.log(filteredAnimeByLatestEpsLessThan24);
	});
});
