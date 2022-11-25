const session = require("express-session");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const myOtpSender = require("../model/sendOTP");
const UserModel = require("../model/userSchema");
const otpLoginModel = require("../model/otpLoginSchema");
const productModel = require('../model/productSchema')
const CART_MODEL = require('../model/cartSchema')
const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
const passwordRegex =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/; // Pattern for Minimum eight characters, at least one letter, one number and one special character



// checks Phone Number exists on database
async function checkPhoneNumber(userPhoneNumber) {
  console.log("checking on database for number:" + userPhoneNumber)
  const PHONE_NUMBER_AS_INTEGER = Number(userPhoneNumber)
  console.log(typeof PHONE_NUMBER_AS_INTEGER)
  const Userfound = await UserModel.findOne({ phone: PHONE_NUMBER_AS_INTEGER });
  if (Userfound) {
    return true; // Phone Number Exists
  } else {
    return false; // Phone Number Doesnot Exists
  }
}

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
  sendToDatabase: async (req, res) => {
    try {
      const validEmail = emailRegex.test(req.body.email)
      const validPassword = passwordRegex.test(req.body.password)

      // Validates User input
      if (req.body.password === req.body.repeatPassword) {
        console.log("valid password")
        const userExist = await checkPhoneNumber(req.body.phone);

        if (userExist == true) {
          res.render('userViews/signup', { msg: 'Phone Number already exists! Try again' })
        } else {

          if (!validEmail && !validPassword) {
            res.render("userViews/signup", { msg: 'Invalid Email Format & Password' })
          } else if (!validEmail) {
            res.render("userViews/signup", { msg: 'Invalid Email Format' })
          } else if (!validPassword) {
            res.render("userViews/signup", { msg: 'password= should be Minimum eight characters, at least one letter, one number and one special character' })
          } else {
            if (
              emailRegex.test(req.body.email) &&
              passwordRegex.test(req.body.password)
            ) {
              const newUser = new UserModel({
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                password: req.body.password,
              });
              newUser.save().then(() => {
                console.log("user added to database");
                res.redirect("/");
              });

            } else {
              res.render("userViews/signup", {
                msg: "Something went wrong!! Try Again",
              });
            }

          }



        }
      } else {
        console.log("password doesn't match");
        res.render("userViews/signup", {
          msg: "password doesn't match. Try Again",
        });
      }

    } catch (error) {
      res.render('userViews/signup', { msg: error })
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
        console.log(userDoc._id)
        if (userDoc.password == req.body.password) {
          if (userDoc.blockStatus == true) {
            res.render("userViews/login", { msg: "You were blocked by Admin" });
          } else {
            req.session.user = userDoc._id;
            res.redirect("/");
          }

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
  // shows page for OTP
  getPhoneNumber: (req, res) => {
    res.render("userViews/otpLogin");
  },
  generateOtp: async (req, res) => {
    console.log(typeof (req.body.phone));

    try {
      const userExist = await checkPhoneNumber(req.body.phone); // check phone Number exists on database

      // Generates random code if user Exists
      const randomCode = (function getRandomCode() {

        if (!userExist) {
          console.log("user does not exist on database")
          res.render("userViews/otpLogin");
          return false;
        } else {
          console.log("user exists");

          // Generates Random 4 digit Code
          return (() => {
            return Math.floor(1000 + Math.random() * 9000);
          })();
        }
      })();

      // Inserts Random code to database
      if (randomCode != false) {
        await otpLoginModel.findOneAndUpdate(
          { phone: req.body.phone },
          { code: randomCode },
          {
            new: true,
            upsert: true,
          }
        );

        const USER_PHONE_NUMBER = `+91` + (req.body.phone)
        console.log(USER_PHONE_NUMBER)

        myOtpSender(randomCode, USER_PHONE_NUMBER); // Sends email to user

        res.render("userViews/verify-otp", { data: req.body.phone }) // Renders page to verify OTP

      }
    } catch (error) {
      console.log(error);
    }
  },

  verifyOtp: async (req, res) => {
    try {
      console.log(req.body.phone);
      console.log(req.body.otp);
      const userCodeObj = await otpLoginModel.findOne({
        phone: req.body.phone
      });

      const userDoc = await UserModel.findOne({ phone: req.body.phone });

      console.log("code from db Is:" + userCodeObj.code);
      if (req.body.otp == userCodeObj.code) {
        if (userCodeObj.blockStatus == true) {
          res.render("userViews/login", { msg: "You were blocked by Admin" });
        } else {
          req.session.user = userDoc._id;
          res.redirect("/");
        }

      } else {
        console.log("otp is Invalid");
        res.redirect("/login");
      }
    } catch (error) { }
  },
  goHome: async (req, res) => {
    if (req.session.user) {
      const products = await productModel.find({})
      res.render("userViews/home", { products: products });
    } else {
      res.redirect("/login");
    }
  },
  getProductInfo: (req, res) => {
    productModel.find({ _id: req.params.id }).then((info) => {
      console.log(info)
      res.render('userViews/productDetails', { info: info })
    })

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
  addToCart: async (req, res) => {
    const USER_ID = req.session.user
    const USER_DOC = await UserModel.findOne({ _id: USER_ID })
    if (USER_ID == USER_DOC) {
      console.log(" user exists ")
    } else {
      console.log("user not exists")
      await CART_MODEL.create({userId: USER_ID, items: [{
        productId: req.params.id,
        quantity: 1
    }]})
    }
  }
};
