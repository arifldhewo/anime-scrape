import test from "@playwright/test";

test.describe("Sandbox", () => {
	test("Test API", async ({ page }) => {
		const response = await page.request.get(
			"https://v17.kuramanime.ink/schedule?scheduled_day=text &need_json=true",
			{
				headers: {
					Cookie:
						"sel_timezone_v2=Asia/Bangkok; auto_timezone_v2=yes; full_timezone_v2=+07; short_timezone_v2=+07; __cflb=04dToYBMicwRDRKRn3UjqatkUx6rdCDVNVhJr7atNT; should_do_galak=hide; XSRF-TOKEN=eyJpdiI6Ik95bmdLTTM1MHgyZG1yNXZ3U083K1E9PSIsInZhbHVlIjoidmNhYjY4YVM3RTBCd0hGcUV4VUdBTWhtNEZlY205SHpJdStxaVlONDczQjdmRWl4R2hDNU9EQVYxcDA5UHZhY0ZZRUFsSU1tM0FxKzMzME83ZlErMU9qOGcwTjFUenZ0N0lkanZDL0k1UmRVMFByS1NYckp0Q3lIZUEzd25FVUciLCJtYWMiOiIyNzVmNzBmMTlhY2MxMjRmNDBlMTcyZjY2MTJiMDcwYjRlYjVkZGFiMDIyMmRiOGI3YjczNTA2ZjU4YWU5ODY2IiwidGFnIjoiIn0%3D; kuramanime_session=eyJpdiI6InRrM0g5VC9teWQ0b2dneGdSc3hKRkE9PSIsInZhbHVlIjoiSXZaa1BydVZOeTczZ0d0VFQ3MnZXa1paZWlsb0RGZ3dIcEs3amxYdy9yUjduMnVzbWhTMmYvTlpxZmFqV0FSQXlXVW5uQzhQTjBmZk5ocnpZcEZxbVVOMkJuZy9UYnpTVHZVaEhDaW9vcEYxTEt1eEU5YWZPMDlDOFkwdU0waWciLCJtYWMiOiIzODkzNzUyMWUwYTViMjllYWE3MTE2ZWI4YzM4ZWMwNjNhMGQ2ZjkyYzBjMTkzMThjYzgzNjFkYjBiY2MzOWI3IiwidGFnIjoiIn0%3D",
				},
			},
		);

		const responseJSON: any = await response.json();

		console.log(responseJSON);
	});
});
