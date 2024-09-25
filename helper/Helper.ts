import { Locator, Page } from "@playwright/test";

export class Helper {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async reqGetResponseWithQueryParam<T>(url: string, queryParams: Record<string, string>): Promise<T> {
    const req = await this.page.request.get(url, {
      params: queryParams,
    });

    return await req.json().catch((err) => console.log(err));
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
}

export function getDate(): string {
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

export function getCurrentDate(): string {
  const date = new Date();

  let currentDay: string = String(date.getDate());
  let currentMonth: string = String(date.getMonth() + 1);
  let currentYear: string = String(date.getFullYear());

  if (currentDay.length === 1) {
    currentDay = `0${currentDay}`;
  }

  if (currentMonth.length === 1) {
    currentMonth = `0${currentMonth}`;
  }

  return `${currentYear}-${currentMonth}-${currentDay}`;
}
