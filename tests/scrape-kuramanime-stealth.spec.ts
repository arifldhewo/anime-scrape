import { getCurrentDate, Helper } from "@/helper/Helper";
import { iQuickResAPI } from "@/Interface/kuramanime/iQuickResAPI";
import { chromium } from "playwright-extra";
import { writeFile, unlink } from "fs/promises";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import today from "today.json";

dotenv.config();
const date = new Date();
if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);
let allInformation: any = [];
let mailOptions: any;

// Add the plugin to playwright (any number of plugins can be added)
chromium.use(StealthPlugin());

// ...(the rest of the quickstart code example is the same)
chromium.launch({ headless: true }).then(async (browser) => {
  const page = await browser.newPage();

  const helper = new Helper(page);
  let firstResponse: iQuickResAPI;

  firstResponse = await helper.reqGetResponseWithQueryParam<iQuickResAPI>("https://kuramanime.dad/quick/ongoing", {
    order_by: "updated",
    page: "1",
    need_json: "true",
  });

  console.log("Scrape First Page Kuramanime");

  const totalPages = firstResponse.animes.last_page;

  let td: string[] = [];

  await unlink("today.json").catch((err) => console.log(err));

  console.log("Remove today.json");

  for (let i = 1; i <= totalPages; i++) {
    const res = await helper.reqGetResponseWithQueryParam<iQuickResAPI>("https://kuramanime.dad/quick/ongoing", {
      order_by: "updated",
      page: `${i}`,
      need_json: "true",
    });

    const resJP = res.animes.data
      .filter((data) => data.country_code === "JP")
      .filter((data) => data.total_episodes <= 27);

    console.log(`On Page${i}`);

    resJP.map((data) => {
      console.log(`Get title ${data.title}`);
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
  }

  await writeFile("today.json", JSON.stringify(allInformation), { flag: "a" }).catch((err) => console.log(err));

  console.log("Writing data success");

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
      <h3> Today Updates: ${getCurrentDate()}</h3>
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

  console.log("Structuring to HTML Process");

  mailOptions = {
    to: `${process.env.RECIPIENT_EMAIL}`,
    from: `${process.env.SENDER_EMAIL}`,
    subject: "Latest Episodes Anime",
    html,
  };

  // await sgMail.send(mailOptions).catch((err) => console.log(err));

  console.log("Sending email");

  await browser.close();
});
