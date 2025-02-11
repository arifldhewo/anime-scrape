import * as dotenv from "dotenv";
import { test } from "@/fixture/kuramanime";
import { iQuickResAPI } from "@/Interface/kuramanime/iQuickResAPI";
import fs, { existsSync } from "fs";
import { iQuickResSearchAPI } from "@/Interface/kuramanime/iQuickResSearchAPI";

dotenv.config();

test.describe("Kuramanime Scrape", () => {
	test("For Global Setup Running", { tag: ["@kuramanime_initiate"] }, async ({ page }) => {
		console.log("for running global setup only");

		const search: iQuickResSearchAPI = JSON.parse(
			Buffer.from(fs.readFileSync("data/search.json")).toString(),
		);

		if (search.animes.data.length === 0) {
			throw new Error("Title is not found");
		}
	});

	const iniate: iQuickResSearchAPI = JSON.parse(Buffer.from(fs.readFileSync("data/search.json")).toString());

	if (iniate.animes?.data?.length !== undefined) {
		for (let i = 0; i < iniate.animes.data.length; i++) {
			test(
				`Scrape anime with title ${iniate.animes.data[i].title}`,
				{ tag: ["@kuramanime_search"] },
				async ({ page }) => {
					const search: iQuickResSearchAPI = JSON.parse(
						Buffer.from(fs.readFileSync("data/search.json")).toString(),
					);

					if (!existsSync("outputm3u")) {
						fs.mkdirSync("outputm3u");
					}

					if (!fs.existsSync(`outputm3u/${search.animes.data[i].slug}.m3u`)) {
						fs.writeFileSync(`outputm3u/${search.animes.data[i].slug}.m3u`, "#EXTM3U", { flag: "a" });
					}

					await page.goto(
						`${process.env.KURAMANIME_BASE_URL}/anime/${search.animes.data[i].id}/${search.animes.data[i].slug}`,
						{
							waitUntil: "networkidle",
						},
					);

					for (let j = 1; j <= search.animes.data[i].posts.length; j++) {
						if (j > search.animes.data[i].total_episodes) {
							break;
						}

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

						const readM3U: string = Buffer.from(
							fs.readFileSync(`outputm3u/${search.animes.data[i].slug}.m3u`),
						).toString();

						if (!readM3U.includes(`Episode ${j}`)) {
							fs.writeFileSync(
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

					fs.writeFileSync("data/search.json", "{}");
				},
			);
		}
	}

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
