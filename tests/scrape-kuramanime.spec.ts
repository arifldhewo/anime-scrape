import test from "@playwright/test";
import Helper from "../helper/helper";
import dotenv from "dotenv";
import { iQuickResAPI } from "../Interface/kuramanime/iQuickResAPI";
import sgMail from "@sendgrid/mail";

dotenv.config();
let firstResponse: iQuickResAPI;
const date = new Date();
if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

test("scrape kuramanime information release every 7PM", { tag: ["@kuramanime"] }, async ({ page }) => {
  const helper = new Helper(page);

  await test.step("Get last page on kuramanime for today", async () => {
    firstResponse = await helper.reqGetResponseWithQueryParam<iQuickResAPI>("https://kuramanime.dad/quick/ongoing", {
      order_by: "updated",
      page: "1",
      need_json: "true",
    });
  });

  const totalPages = firstResponse.animes.last_page;

  let td: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    await test.step(`Scrape on page ${i}`, async () => {
      const res = await helper.reqGetResponseWithQueryParam<iQuickResAPI>("https://kuramanime.dad/quick/ongoing", {
        order_by: "updated",
        page: `${i}`,
        need_json: "true",
      });

      const resJP = res.animes.data.filter((data) => data.country_code === "JP");

      resJP.map((data) => {
        td.push(`
        <tr>
          <td> ${data.title} </td>
          <td> ${data.latest_episode} </td>
          <td> ${data.total_episodes} </td>
          <td> ${data.latest_post_at} </td>
        </tr>
        `);
      });
    });
  }

  let tdFilter: string = "";

  td.map((data) => {
    tdFilter += data;
  });

  let html: string = `
      <html>
        <head>
        </head>
        <body>
          <h1>Latest Episodes on Kuramanime</h1>
          <h3> Today Date: ${helper.getDate()}</h3>
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
      subject: "Latest Kuramanime Episodes Today",
      html,
    };

    await sgMail.send(mailOptions).catch((err) => console.log(err));
  });
});
