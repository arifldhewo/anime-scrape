require("dotenv").config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const mailOptions = {
  to: "arifldhewo234@gmail.com",
  from: "arifldhewo.testing@gmail.com",
  subject: "Important Message",
  text: "This is a test email from SendGrid."
};

sgMail.send(mailOptions)
.then((res) => console.log(res))
.catch((err) => console.log(err));