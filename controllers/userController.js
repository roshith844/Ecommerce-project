const session = require("express-session");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const myOtpSender = require("../model/sendOTP");
const USER_MODEL = require("../model/userSchema");
const otpLoginModel = require("../model/otpLoginSchema");
const PRODUCT_MODEL = require("../model/productSchema");
const CART_MODEL = require("../model/cartSchema");
const ORDER_MODEL = require("../model/orderSchema");
const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
const passwordRegex =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/; // Pattern for Minimum eight characters, at least one letter, one number and one special character

// To increment by one on cart
async function addOneProduct(userId, productId) {
  await CART_MODEL.updateOne(
    { userId: userId, items: { $elemMatch: { productId: productId } } },
    { $inc: { "items.$.quantity": 1 } }
  ).then(() => {
    console.log("updated incremented");
  });
}

// checks Phone Number exists on database
async function checkPhoneNumber(userPhoneNumber) {
  console.log("checking on database for number:" + userPhoneNumber);
  const PHONE_NUMBER_AS_INTEGER = Number(userPhoneNumber);
  console.log(typeof PHONE_NUMBER_AS_INTEGER);
  const Userfound = await USER_MODEL.findOne({
    phone: PHONE_NUMBER_AS_INTEGER,
  });
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
      const validEmail = emailRegex.test(req.body.email);
      const validPassword = passwordRegex.test(req.body.password);

      // Validates User input
      if (req.body.password === req.body.repeatPassword) {
        console.log("valid password");
        const userExist = await checkPhoneNumber(req.body.phone);

        if (userExist == true) {
          res.render("userViews/signup", {
            msg: "Phone Number already exists! Try again",
          });
        } else {
          if (!validEmail && !validPassword) {
            res.render("userViews/signup", {
              msg: "Invalid Email Format & Password",
            });
          } else if (!validEmail) {
            res.render("userViews/signup", { msg: "Invalid Email Format" });
          } else if (!validPassword) {
            res.render("userViews/signup", {
              msg: "password= should be Minimum eight characters, at least one letter, one number and one special character",
            });
          } else {
            if (
              emailRegex.test(req.body.email) &&
              passwordRegex.test(req.body.password)
            ) {
              const newUser = new USER_MODEL({
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
      res.render("userViews/signup", { msg: error });
    }
  },
  doLogin: async (req, res) => {
    try {
      // Checks with regex patterns
      if (
        emailRegex.test(req.body.email) &&
        passwordRegex.test(req.body.password)
      ) {
        const userDoc = await USER_MODEL.findOne({ email: req.body.email });
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
    console.log(typeof req.body.phone);

    try {
      const userExist = await checkPhoneNumber(req.body.phone); // check phone Number exists on database

      // Generates random code if user Exists
      const randomCode = (function getRandomCode() {
        if (!userExist) {
          console.log("user does not exist on database");
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

        const USER_PHONE_NUMBER = `+91` + req.body.phone;
        console.log(USER_PHONE_NUMBER);

        myOtpSender(randomCode, USER_PHONE_NUMBER); // Sends email to user

        res.render("userViews/verify-otp", { data: req.body.phone }); // Renders page to verify OTP
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
        phone: req.body.phone,
      });

      const userDoc = await USER_MODEL.findOne({ phone: req.body.phone });

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
    } catch (error) {}
  },
  goHome: async (req, res) => {
    if (req.session.user) {
      const products = await PRODUCT_MODEL.find({});
      res.render("userViews/home", { products: products });
    } else {
      res.redirect("/login");
    }
  },
  getProductInfo: (req, res) => {
    PRODUCT_MODEL.find({ _id: req.params.id }).then((info) => {
      res.render("userViews/productDetails", { info: info });
    });
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

  viewCart: async (req, res) => {
    const USER_ID = req.session.user;

    // checks for products available in cart or not
    const RESULT = CART_MODEL.countDocuments({ userId: USER_ID })
      .then((count) => {
        return count;
      })
      .then(async (count) => {
        if (count < 1) {
          res.render("userViews/no-items");
        } else {
          // Shows cart items
          let products = await CART_MODEL.findOne({ userId: USER_ID })
            .populate("items.productId")
            .lean();
          res.render("userViews/cart", { productDetails: products.items });
        }
      });
  },

  addToCart: async (req, res) => {
    const USER_ID = req.session.user;
    console.log(USER_ID);
    console.log(req.params.id);

    const USER = await CART_MODEL.findOne({ userId: USER_ID }); // checks user on db
    console.log(USER);

    // Checking weather user has a cart or not
    if (USER) {
      // checks product exists on cart
      const PRODUCT_EXIST = await CART_MODEL.findOne({
        items: { $elemMatch: { productId: req.params.id } },
      });
      if (PRODUCT_EXIST) {
        addOneProduct(USER_ID, req.params.id);

        // if product is not there, Adds the product to cart
      } else {
        console.log("product not there");
        await CART_MODEL.updateOne(
          { userId: USER_ID },
          { $push: { items: { productId: req.params.id } } }
        );
      }

      // if user doesnot has a cart, Create new cart
    } else {
      console.log("user is not here");
      await CART_MODEL.create({
        userId: USER_ID,
        items: [
          {
            productId: req.params.id,
            quantity: 1,
          },
        ],
      });
    }
    res.redirect("/cart");
  },
  viewEditQuantity: async (req, res) => {
    await CART_MODEL.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.session.user) } },
      { $unwind: "$items" },
      {
        $match: {
          "items.productId": new mongoose.Types.ObjectId(req.params.id),
        },
      },
    ]).then((result) => {
      res.render("userViews/edit-cart", { productInfo: result });
    });
  },
  updateQuantity: async (req, res) => {
    await CART_MODEL.updateOne(
      {
        userId: req.session.user,
        items: { $elemMatch: { productId: req.body.productId } },
      },
      { $set: { "items.$.quantity": req.body.quantity } }
    );
    res.redirect("/cart");
  },
  deleteCartItem: async (req, res) => {
    await CART_MODEL.updateMany(
      { userId: req.session.user },
      { $pull: { items: { productId: req.params.id } } }
    ).then(() => {
      res.redirect("/cart");
    });
  },
  viewAddressSelection: async (req, res) => {
    const USER_INFO = await USER_MODEL.findOne({ _id: req.session.user }).then(
      (userInfo) => {
        res.render("userViews/select-address", { address: userInfo.address });
      }
    );
  },
  viewAddAddress: (req, res) => {
    res.render("userViews/add-address");
  },
  addAddress: async (req, res) => {
    await USER_MODEL.updateOne(
      { _id: req.session.user },
      {
        $push: {
          address: {
            address_line_1: req.body.address_line_1,
            address_line_2: req.body.address_line_2,
            landmark: req.body.landmark,
            town: req.body.town,
            state: req.body.state,
            pin_code: req.body.pin_code,
          },
        },
      }
    );
    res.redirect("/checkout");
  },
  viewSelectPayment: async (req, res) => {
    // Takes Full address of user from ObjectID of address choosen by User
    await USER_MODEL.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.session.user) } },
      { $unwind: "$address" },
      {
        $match: {
          "address._id": new mongoose.Types.ObjectId(req.body.address),
        },
      },
    ]).then((result) => {
      res.render("userViews/select-payment", { address: result[0].address });
    });
  },

  placeOrder: async (req, res) => {
    console.log("placing order");
    const USER_CART = await CART_MODEL.findOne({ userId: req.session.user });
    ORDER_MODEL.create({
      userId: USER_CART.userId,
      items: USER_CART.items,
      address: {
        address_line_1: req.body.address_line_1,
        address_line_2: req.body.address_line_2,
        landmark: req.body.landmark,
        town: req.body.town,
        state: req.body.state,
        pin_code: req.body.pin_code,
      },
      payment_method: req.body.payment,
    }).then(() => {
      res.render("userViews/order-placed");
    });
    CART_MODEL.deleteOne({ userId: req.session.user }, (err) => {
      if (err) {
        console.log(err);
      }
    });
  },

  viewProfile: async (req, res) => {
    const USER_DATA = await USER_MODEL.findOne({ _id: req.session.user });
    res.render("userViews/profile", { userData: USER_DATA });
  },
  viewEditProfile: async (req, res) => {
    const USER_DATA = await USER_MODEL.findOne({ _id: req.session.user });
    res.render("userViews/edit-profile-info", { userData: USER_DATA });
  },
  editProfile: async (req, res) => {
    await USER_MODEL.updateOne(
      { _id: req.session.user },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
        },
      }
    );
    res.redirect("/profile");
  },
  viewEditAddress: (req, res) => {
    USER_MODEL.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.session.user) } },
      { $unwind: "$address" },
      { $match: { "address._id": new mongoose.Types.ObjectId(req.params.id) } },
    ]).then((doc) => {
      res.render("userViews/edit-address", { address: doc[0].address });
    });
  },
  editAddress: async (req, res) => {
    // Updates address details inside array using Object id of inner-object to change
    await USER_MODEL.updateOne(
      { _id: req.session.user, address: { $elemMatch: { _id: req.body.id } } },
      {
        $set: {
          "address.$.address_line_1": req.body.address_line_1,
          "address.$.address_line_2": req.body.address_line_2,
          "address.$.landmark": req.body.landmark,
          "address.$.town": req.body.town,
          "address.$.state": req.body.state,
          "address.$.pin_code": req.body.pin_code,
        },
      }
    ).then(() => {
      res.redirect("/profile");
    });
  },
  profileViewAddAddress: (req, res) => {
    res.render("userViews/profile-add-address");
  },
  addProfileAddress: async (req, res) => {
    await USER_MODEL.updateOne(
      { _id: req.session.user },
      {
        $push: {
          address: {
            address_line_1: req.body.address_line_1,
            address_line_2: req.body.address_line_2,
            landmark: req.body.landmark,
            town: req.body.town,
            state: req.body.state,
            pin_code: req.body.pin_code,
          },
        },
      }
    );
    res.redirect("/profile");
  },
  viewOrdersToUser: async (req, res) => {
    ORDER_MODEL.countDocuments({ userId: req.session.user })
      .then((count) => {
        return count;
      }).then(async (count) => {
        if (count < 1) {
          res.render("userViews/no-items");
        } else {
          const ORDERS = await ORDER_MODEL.find({ userId: req.session.user })
            .populate("items.productId")
            .lean();
          res.render("userViews/orders", { orderDetails: ORDERS });
        }
      });
  },
  cancelOrderByUser: async (req, res) => {
    console.log("cancel order by user");
    console.log(req.session.user);
    console.log(req.params.id);
    await ORDER_MODEL.updateOne(
      { _id: req.params.id },
      { $set: { status: "cancelled" } }
    ).then(() => {
      res.redirect("/orders");
    });
  },
  viewChangePassword: (req, res) => {
    res.render("userViews/change-password");
  },
  changePassword: async (req, res) => {
    await USER_MODEL.updateOne(
      { _id: req.session.user },
      { $set: { password: req.body.password } }
    ).then(() => {
      res.redirect("/profile");
    });
  },
};
