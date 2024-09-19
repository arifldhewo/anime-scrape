import test from "@playwright/test";
import Helper from "../helper/helper";
import dotenv from "dotenv";
import { iQuickResAPI } from "../Interface/kuramanime/iQuickResAPI";
import sgMail from "@sendgrid/mail";

dotenv.config();
let firstResponse: iQuickResAPI;
let allFilterPages: any[] = [];

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

  for (let i = 1; i <= totalPages; i++) {
    await test.step(`Scrape on page ${i}`, async () => {
      const res = await helper.reqGetResponseWithQueryParam<iQuickResAPI>("https://kuramanime.dad/quick/ongoing", {
        order_by: "updated",
        page: `${i}`,
        need_json: "true",
      });

      const resJP = res.animes.data.filter((data) => data.country_code === "JP");

      resJP.map((data) => {
        let obj = {
          title: data.title,
          latestEpisode: data.latest_episode,
          totalEpisodes: data.total_episodes,
          latestPostAt: data.latest_post_at,
        };

        allFilterPages.push(obj);
      });
    });
  }

  test.step(`Sending to email ${process.env.RECIPIENT_EMAIL}`, () => {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const mailOptions = {
        to: `${process.env.RECIPIENT_EMAIL}`,
        from: `${process.env.SENDER_EMAIL}`,
        subject: "Latest Kuramanime Episodes Today",
        text: `${allFilterPages.toString()}`,
      };

      sgMail
        .send(mailOptions)
        .then((res) => console.log(res))
        .catch((err) => console.log(err));
    } else {
      console.error("SENDGRID_API_KEY undefined");
    }
  });
});
