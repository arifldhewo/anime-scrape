import { test, expect } from "@playwright/test";
import Helper from "@/helper/Helper";
import dotenv from "dotenv";
import { iQuickResAPI } from "@/Interface/kuramanime/iQuickResAPI";
import sgMail from "@sendgrid/mail";
import { writeFile, unlink } from "node:fs/promises";
import today from "today.json";

dotenv.config();
const date = new Date();
if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);
let allInformation: any = [];

test("scrape kuramanime information release every 7PM", { tag: ["@kuramanime_update"] }, async ({ page }) => {
  const helper = new Helper(page);
  let firstResponse: iQuickResAPI;
  await test.step("Get first page on kuramanime for today", async () => {
    firstResponse = await helper.reqGetResponseWithQueryParam<iQuickResAPI>("https://kuramanime.dad/quick/ongoing", {
      order_by: "updated",
      page: "1",
      need_json: "true",
    });
  });

  const totalPages = firstResponse.animes.last_page;

  let td: string[] = [];

  await unlink("today.json").catch((err) => console.log(err));

  for (let i = 1; i <= totalPages; i++) {
    await test.step(`Scrape on page ${i}`, async () => {
      const res = await helper.reqGetResponseWithQueryParam<iQuickResAPI>("https://kuramanime.dad/quick/ongoing", {
        order_by: "updated",
        page: `${i}`,
        need_json: "true",
      });

      const resJP = res.animes.data
        .filter((data) => data.country_code === "JP")
        .filter((data) => data.total_episodes <= 27);

      resJP.map((data) => {
        td.push(`
          <tr>
            <td> ${data.title} </td>
            <td> ${data.latest_episode} </td>
            <td> ${data.total_episodes} </td>
            <td> ${data.latest_post_at} </td>
          </tr>
          `);

        allInformation.push(data);
      });
    });
  }

  await writeFile("today.json", JSON.stringify(allInformation), { flag: "a" }).catch((err) => console.log(err));

  let tdFilter: string = "";

  td.map((data) => {
    tdFilter += data;
  });

  let html: string = `
        <html>
          <head>
          </head>
          <body>
            <h1>Latest Anime Episodes</h1>
            <h3> Today Date: ${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}  ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}</h3>
            <table>
            <tr>
              <th> Title </th>
              <th> Latest Episode </th>
              <th> Total Episode </th>
              <th> Latest Post At </th>
            </tr>
            ${tdFilter}
            </table>
          </body>
        </html>
      `;

  await test.step(`Sending to email ${process.env.RECIPIENT_EMAIL}`, async () => {
    const mailOptions = {
      to: `${process.env.RECIPIENT_EMAIL}`,
      from: `${process.env.SENDER_EMAIL}`,
      subject: "Latest Episodes Anime",
      html,
    };

    await sgMail.send(mailOptions).catch((err) => console.log(err));
  });
});

const below27Eps = today.filter((filter) => {
  return filter.total_episodes <= 27 && filter.latest_episode <= 27;
});

below27Eps.map((data) => {
  test(`scrape anime ${data.title}`, { tag: ["@kuramanime_video"] }, async ({ page }) => {
    const helper = new Helper(page);
    await unlink(`./output/${data.slug}.m3u`).catch((err) => console.error(err));

    await writeFile(`./output/${data.slug}.m3u`, "#EXTM3U", { flag: "a" }).catch((err) => console.error(err));

    for (let i = data.posts.length - 1; i >= 0; i--) {
      await helper.getAPIResJSONByGoto(
        "https://kuramanime.dad/misc/post/count-views",
        `https://kuramanime.dad/anime/${data.id}/${data.slug}/episode/${data.posts[i].episode}`
      );

      await expect(page.locator("#player")).toBeVisible();

      await page
        .locator("#source720")
        .getAttribute("src")
        .then((src) => {
          writeFile(`./output/${data.slug}.m3u`, `\n#EXTINF:-1, ${data.title} - ${data.posts[i].episode}\n${src}`, {
            flag: "a",
          }).catch((err) => console.error(err));
        });
    }
  });
});
