import { test, expect } from "@playwright/test";
import { unlink, writeFile } from "node:fs/promises";

const config = {
  title: "Monogatari Series",
  titlePerEps: "Monogatari Series: Off & Monster Season",
  titleSave: "Monogatari Series Off Season",
  totalEps: 9,
};

for (let i = 1; i <= config.totalEps; i++) {
  test(`scrape samehadaku ${i}`, { tag: ["@samehadaku"] }, async ({ page }) => {
    if (i == 1) {
      await unlink(`./output/${config.titleSave}.m3u`).catch((err) => console.error(err));

      await writeFile(`./output/${config.titleSave}.m3u`, "#EXTM3U", { flag: "a" }).catch((err) => console.error(err));
    }

    await page.goto("https://samehadaku.email");

    await page.getByRole("textbox", { name: "Search..." }).fill(config.title);

    await page.getByRole("textbox", { name: "Search..." }).press("Enter");

    await page.getByRole("link", { name: config.title }).click();

    await page.waitForURL(/\/anime\//);

    await page.getByRole("link", { name: `${config.titlePerEps} Episode ${i}`, exact: true }).click();

    await expect(page.getByText("Link Download MP4")).toBeVisible();

    const page1Promise = page.waitForEvent("popup");

    await page
      .locator(".download-eps:nth-of-type(2) li:nth-of-type(4)")
      .getByText("Krakenfiles")
      .click({ force: true });

    const page1 = await page1Promise;

    await page1
      // .frameLocator("iframe")
      // .first()
      .locator("div > video > source")
      .getAttribute("src")
      .then((data) => {
        let saveM3U = `\n#EXTINF:-1, Episode ${i} - ${config.titleSave}\nhttps:${data}`;

        // unlink(`./output/${config.titlePerEps} ${i}.json`).catch((err) => console.error(err));

        writeFile(`./output/${config.titleSave}.m3u`, saveM3U, {
          flag: "a",
        }).catch((err) => console.error(err));
      })
      .catch((err) => console.error(err));

    // await newPage.locator(".btn-primary > .glyphicon-play-circle").click();

    // const elVideo = await newPage.locator(".jw-video").click();

    // await page.getByRole("link", { name: config.title }).click();
  });
}

