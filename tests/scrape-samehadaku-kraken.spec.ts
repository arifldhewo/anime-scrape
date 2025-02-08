import { test, expect } from "@playwright/test";
import { unlink, writeFile } from "node:fs/promises";

const config = {
	searchTitle: "Dungeon no Naka no Hito",
	titlePerEps: "Dungeon no Naka no Hito",
	titleSave: "Dungeon no Naka no Hito",
	latestEps: 11,
	streamService: "Krakenfiles",
};

/* 
  API Search Kuramanime: https://kuramanime.dad/anime?search=Yozakura&order_by=oldest&need_json=true
  response ada id, slug, title

  API Quick / Lihat Semua : https://kuramanime.dad/quick/ongoing?order_by=updated&page=2&need_json=true 

  Web Detail Page Kuramanime https://kuramanime.dad/anime/2668/yozakura-san-chi-no-daisakusen https://kuramanime.dad/anime/:id/:slug

  Web Eps Page Kuramanime https://kuramanime.dad/anime/2668/yozakura-san-chi-no-daisakusen/episode/24 https://kuramanime.dad/adnime/:id/:slug/episode/:iteration
*/
for (let i = 1; i <= config.latestEps; i++) {
	test(
		`scrape anime ${config.titleSave} on samehadaku episode ${i}`,
		{ tag: ["@samehadaku"] },
		async ({ page }) => {
			await test.step("Create m3u files on first iteration", async () => {
				if (i == 1) {
					await unlink(`./output/${config.titleSave}.m3u`).catch((err) => console.error(err));

					await writeFile(`./output/${config.titleSave}.m3u`, "#EXTM3U", {
						flag: "a",
					}).catch((err) => console.error(err));
				}
			});

			await test.step(`Accessing detail anime with title ${config.titleSave} on Episode ${i}`, async () => {
				await page.goto("https://samehadaku.email");

				await page.getByRole("textbox", { name: "Search..." }).fill(config.searchTitle);

				await page.getByRole("textbox", { name: "Search..." }).press("Enter");

				await page.getByRole("link", { name: config.searchTitle }).click();

				await page.waitForURL(/\/anime\//);

				await page
					.getByRole("link", {
						name: `${config.titlePerEps} Episode ${i}`,
						exact: true,
					})
					.click();

				await expect(page.getByText("Link Download MP4")).toBeVisible();
			});

			await test.step(`Open new tab with ${config.streamService} stream service `, async () => {
				const page1Promise = page.waitForEvent("popup");

				await page
					.locator(".download-eps:nth-of-type(2) li:nth-of-type(4)")
					.getByText(config.streamService)
					.click({ force: true });

				const page1 = await page1Promise;

				await page1
					.locator("div > video > source")
					.getAttribute("src")
					.then((data) => {
						let saveM3U = `\n#EXTINF:-1, ${config.titleSave} - Episode ${i}\nhttps:${data}`;

						writeFile(`./output/${config.titleSave}.m3u`, saveM3U, {
							flag: "a",
						}).catch((err) => console.error(err));

						console.log(`Getting Data: ${saveM3U}  \n\nAND SAVE IT ON OUTPUT FOLDER`);
					})
					.catch((err) => console.error(err));
			});
		},
	);
}
