import * as dotenv from "dotenv";
import test, { APIResponse } from "@playwright/test";
import { iQuickResAPI } from "@/Interface/kuramanime/iQuickResAPI";
import fs from "fs";

dotenv.config();

test.describe("Kuramanime Scrape", () => {
	test(
		`Scrape anime with title ${process.env.SEARCH_ANIME_TITLE}`,
		{ tag: ["@kuramanime_update"] },
		async ({ page }) => {
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

			fs.writeFileSync(`data/${filteredAnime[0].title}.m3u`, "#EXTM3U", { flag: "a" });

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
					`data/${filteredAnime[0].title}.m3u`,
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
});
