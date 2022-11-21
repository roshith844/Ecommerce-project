const nodemailer = require('nodemailer')
require('dotenv').config()

function sendMail(randomCode, UserEmail){

// Sends email
const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.FROM_EMAIL,
        pass: process.env.APP_PASSWORD
    }
})

// Email content
const details = {
    from: 'roshith844@gmail.com',
    to: UserEmail,
    subject: 'Your Otp for Cake shop',
    text: 'Your OTP for cake shop is ' + randomCode
}

mailTransporter.sendMail(details, (err) => {
    if (err) {
        console.log('mail error :', err)
    } else {
        console.log('email send')
    }
})
}

module.exports = sendMail