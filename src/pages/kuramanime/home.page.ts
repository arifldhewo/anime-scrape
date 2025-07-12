import { Locator, Page } from "@playwright/test";

export default class Home {
	iconSearch: Locator;
	inputSearch: Locator;

	constructor(page: Page) {
		this.iconSearch = page.locator(".icon_search");
		this.inputSearch = page.locator(`#search-input`);
	}
}
