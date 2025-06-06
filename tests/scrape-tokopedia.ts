import { chromium } from "playwright-extra";
import stealtPlugin from "puppeteer-extra-plugin-stealth";
import stocks from "@/data/tokopedia_stock.json";

chromium.use(stealtPlugin());

stocks.map((stock) => {
	chromium.launch({ headless: true }).then(async (browser) => {
		const page = await browser.newPage();

		await page.goto(stock.link, { waitUntil: "networkidle" });

		const remainingStock = await page.locator("p > b").nth(0).textContent();

		console.log(`
            Product: ${stock.title}
            Remaining Stock: ${remainingStock}`);

		await browser.close();
	});
});
