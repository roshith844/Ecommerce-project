const nodemailer = require('nodemailer')
require('dotenv').config()
const twilio = require('twilio')

const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

function sendOTP(randomCode, userNumber) {

  client.messages
    .create({
      to: userNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: 'Cake shop Otp' + randomCode,
    })
    .then((message) => console.log(`Message SID ${message.sid}`))
    .catch((error) => console.error(error));

  // // Sends email
  // const mailTransporter = nodemailer.createTransport({
  //     service: 'gmail',
  //     auth: {
  //         user: process.env.FROM_EMAIL,
  //         pass: process.env.APP_PASSWORD
  //     }
  // })

  // // Email content
  // const details = {
  //     from: 'roshith844@gmail.com',
  //     to: UserEmail,
  //     subject: 'Your Otp for Cake shop',
  //     text: 'Your OTP for cake shop is ' + randomCode
  // }

  // mailTransporter.sendMail(details, (err) => {
  //     if (err) {
  //         console.log('mail error :', err)
  //     } else {
  //         console.log('email send')
  //     }
  // })
}

module.exports = sendOTP