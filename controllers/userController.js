const session = require("express-session");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const myEmailSender = require("../model/SendEmail");
const UserModel = require("../model/userSchema");
const otpLoginModel = require("../model/otpLoginSchema");
const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
const passwordRegex =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/; // Pattern for Minimum eight characters, at least one letter, one number and one special character

module.exports = {
  // Renders Login Page
  goToLogin: (req, res) => {
    res.render("userViews/login", { msg: "" });
  },
  // Renders Signup page
  goTosignUp: (req, res) => {
    res.render("userViews/signup", { msg: "" });
  },
  // Sends user data to database for Registration
  sendToDatabase: (req, res) => {
    // Validates User input
    if (req.body.password === req.body.repeatPassword) {
      // Checks with regex patterns
      if (
        emailRegex.test(req.body.email) &&
        passwordRegex.test(req.body.password)
      ) {
        const newUser = new UserModel({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
        });
        newUser.save().then(() => {
          console.log("user added to database");
          res.redirect("/");
        });
      } else {
        res.render("userViews/signup", {
          msg: "Invalid credentials!! 1. Email should be in proper form  2. password should be Minimum eight characters, at least one letter, one number and one special character 3. Password should match",
        });
      }
    } else {
      console.log("password doesn't match");
      res.render("userViews/signup", {
        msg: "password doesn't match. Try Again",
      });
    }
  },
  doLogin: async (req, res) => {
    try {
      // Checks with regex patterns
      if (
        emailRegex.test(req.body.email) &&
        passwordRegex.test(req.body.password)
      ) {
        const userDoc = await UserModel.findOne({ email: req.body.email });
        if (userDoc.password == req.body.password) {
          req.session.user = req.body.email;
          res.redirect("/");
        } else {
          res.render("userViews/login", { msg: "Invalid credentials!!" });
        }
      } else {
        if (
          emailRegex.test(req.body.email) == false &&
          passwordRegex.test(req.body.password) == false
        ) {
          res.render("userViews/login", { msg: "Invalid email or Password" });
        } else if (emailRegex.test(req.body.email) == false) {
          res.render("userViews/login", {
            msg: "Invalid credentials!! Enter a valid email Address",
          });
        } else if (passwordRegex.test(req.body.password) == false) {
          res.render("userViews/login", {
            msg: "password should be Minimum eight characters, at least one letter, one number and one special character",
          });
        } else {
          res.render("userViews/login", { msg: "Something went wrong" });
        }
      }
    } catch {
      res
        .status(400)
        .render("userViews/login", { msg: "invalid credentials!! Try Again" });
    }
  },
  getEmailForOTP: (req, res) => {
    res.render("userViews/otpLogin");
  },
  generateOtp: async (req, res) => {
    console.log(req.body.email);
    try {
      // checks email exists on database
      async function emailExists(userEmail) {
        const Userfound = await UserModel.findOne({ email: userEmail });
        if (Userfound) {
          return true; // Email Exists
        } else {
          return false; // Email Doesnot Exists
        }
      }

      const userExist = await emailExists(req.body.email);

      // Generates random code if user Exists
      const randomCode = (function getRandomCode() {
        if (!userExist) {
          res.render("userViews/otpLogin");
        } else {
          console.log("user exists");

          // Generates Random 4 digit Code
          return (() => {
            return Math.floor(1000 + Math.random() * 9000);
          })();
        }
        return false;
      })();

      if (randomCode != false) {
        await otpLoginModel.findOneAndUpdate(
          { email: req.body.email },
          { code: randomCode },
          {
            new: true,
            upsert: true,
          }
        );
        myEmailSender(randomCode, req.body.email); // Sends email to user
        res.render("userViews/verify-otp", { data: req.body.email });
      }
    } catch (error) {
      console.log(error);
    }
  },
  verifyOtp: async (req, res) => {
    try {
      console.log(req.body.email);
      console.log(req.body.otp);
      const userCodeObj = await otpLoginModel.findOne({
        email: req.body.email,
      });
      console.log("code from db Is:" + userCodeObj.code);
      if (req.body.otp == userCodeObj.code) {
        req.session.user = req.body.email;
        res.redirect("/");
      } else {
        console.log("otp is Invalid");
        res.redirect("/login");
      }
    } catch (error) {}
  },
  goHome: (req, res) => {
    if (req.session.user) {
      res.render("userViews/home");
    } else {
      res.redirect("/login");
    }
  },
  doLogout: (req, res) => {
    // Destroys session
    req.session.destroy((error) => {
      if (error) {
        console.log(error);
      } else {
        console.log("logout successfully");
        res.redirect("/login");
      }
    });
  },
};
