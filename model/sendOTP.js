// require('dotenv').config()
// const twilio = require('twilio')

// const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

// function sendOTP(randomCode, userNumber) {

//   client.messages
//     .create({
//       to: userNumber,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       body: 'Cake shop Otp' + randomCode,
//     })
//     .then((message) => console.error(`Message SID ${message.sid}`))
//     .catch((error) => console.error(error));
// }

// module.exports = sendOTP