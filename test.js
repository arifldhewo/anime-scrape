require("dotenv").config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const html =   ``

const mailOptions = {
  to: "arifldhewo@mailsac.com",
  from: "arifldhewo.testing@gmail.com",
  subject: "OTP",
  html
};

sgMail.send(mailOptions)
.then((res) => console.log(res))
.catch((err) => console.log(err));