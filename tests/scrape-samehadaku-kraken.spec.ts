import { test, expect } from "@playwright/test";
import { unlink, writeFile } from "node:fs/promises";

const config = {
  searchTitle: "Yozakura",
  titlePerEps: "Mission Yozakura Family",
  titleSave: "Mission Yozakura Family",
  totalEps: 24,
  streamService: "Krakenfiles",
};

for (let i = 9; i <= config.totalEps; i++) {
  test(`scrape anime ${config.titleSave} on samehadaku episode ${i}`, { tag: ["@samehadaku"] }, async ({ page }) => {
    await test.step("Create m3u files on first iteration", async () => {
      if (i == 9) {
        await unlink(`./output/${config.titleSave}.m3u`).catch((err) => console.error(err));

        await writeFile(`./output/${config.titleSave}.m3u`, "#EXTM3U", { flag: "a" }).catch((err) =>
          console.error(err)
        );
      }
    });

    await test.step(`Accessing detail anime with title ${config.titleSave} on Episode ${i}`, async () => {
      await page.goto("https://samehadaku.email");

      await page.getByRole("textbox", { name: "Search..." }).fill(config.searchTitle);

      await page.getByRole("textbox", { name: "Search..." }).press("Enter");

      await page.getByRole("link", { name: config.searchTitle }).click();

      await page.waitForURL(/\/anime\//);

      await page.getByRole("link", { name: `${config.titlePerEps} Episode ${i}`, exact: true }).click();

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
  });
}

