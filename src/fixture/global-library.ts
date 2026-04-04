import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { kuramanimeInit } from "./modules/kuramanime";

async function globalSetup(): Promise<void> {
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();

	if (!existsSync(`data`)) {
		mkdirSync(`data`);
	}

	//retrieve data process
	await Promise.all([kuramanimeInit(page)]);
}

export default globalSetup;
