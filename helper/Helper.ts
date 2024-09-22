import { Locator, Page } from "@playwright/test";

export default class Helper {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async reqGetResponseWithQueryParam<T>(url: string, queryParams: Record<string, string>): Promise<T> {
    const req = await this.page.request.get(url, {
      params: queryParams,
    });

    return await req.json();
  }

  async getAPIResJSONByClick<T>(urlAPI: string, locator: Locator | null, first: boolean): Promise<T> {
    const apiPromise = this.page.waitForResponse(urlAPI);
    if (first) {
      await this.page.goto("/");
    } else if (locator) {
      await locator.click();
    }

    const api = await apiPromise;

    return await api.json();
  }

  async getAPIResJSONByGoto<T>(urlAPI: string, url: string | null): Promise<T> {
    const apiPromise = this.page.waitForResponse(urlAPI);
    if (url) {
      await this.page.goto(url);
    } else {
      await this.page.goto("/");
    }

    const api = await apiPromise;

    return await api.json();
  }

  getDate(): string {
    const date = new Date();
    const allMonths: string[] = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "May",
      "June",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const currentMonth = allMonths[date.getMonth()];

    return `${date.getDate()}-${currentMonth}-${date.getFullYear()}`;
  }
}
