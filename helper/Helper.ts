import { Page } from "@playwright/test";

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

    const currentMonth = allMonths[date.getMonth() - 1];

    return `${date.getDate()}-${currentMonth}-${date.getFullYear()}`;
  }
}
