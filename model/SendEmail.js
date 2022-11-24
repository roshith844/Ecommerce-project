const nodemailer = require('nodemailer')
require('dotenv').config()
const twilio = require('twilio')

const client = twilio('AC509253220bcd5c75e103ee01ab5dc674', 'ac06299252a62203e83eef85e2961a85');

function sendMail(randomCode, userNumber) {
    
client.messages
  .create({
    to:  userNumber,
    from: '+13514449864',
    body: 'Cake shop Otp'+ randomCode,
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

module.exports = sendMail