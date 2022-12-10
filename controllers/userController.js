const session = require("express-session");
const crypto = require('crypto')
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const MY_OTP_SENDER = require("../model/sendOTP");
const USER_MODEL = require("../model/userSchema");
const OTP_LOGIN_MODEL = require("../model/otpLoginSchema");
const PRODUCT_MODEL = require("../model/productSchema");
const CART_MODEL = require("../model/cartSchema");
const ORDER_MODEL = require("../model/orderSchema");
const EMAIL_REGEX = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/; // Pattern for Minimum eight characters, at least one letter, one number and one special character
const Razorpay = require('razorpay');
var cartItemsCount = 0;
var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// To increment by one on cart
async function addOneProduct(userId, productId) {
  await CART_MODEL.updateOne(
    { userId: userId, items: { $elemMatch: { productId: productId } } },
    { $inc: { "items.$.quantity": 1 } }
  ).then(() => {
    console.log("updated incremented");
  });
}

// To Decrement by one on cart
async function removeOneProduct(userId, productId) {
  const QUANTITY = await CART_MODEL.aggregate([{ $match: { userId: mongoose.Types.ObjectId(userId), items: { $elemMatch: { productId: mongoose.Types.ObjectId(productId) } } } }, { $unwind: "$items" }, { $match: { "items.productId": mongoose.Types.ObjectId(productId) } }]).then((result) => {
    return result;
  })
  if (QUANTITY[0].items.quantity != 1) {
    await CART_MODEL.updateOne(
      { userId: userId, items: { $elemMatch: { productId: productId } } },
      { $inc: { "items.$.quantity": -1 } }
    ).then(() => {
      console.log("updated Decremented");
    });

  } else {
    return false
  }
}

// Calculates Total Price of Cart items
function getTotalPrice(userId) {
  return new Promise((resolve, reject) => {
    CART_MODEL.findOne({ userId: userId }).populate("items.productId").lean().then((result) => {
      let totalPrice = 0;
      for (let i = 0; i < result.items.length; i++) {
        totalPrice += (result.items[i].quantity) * (result.items[i].productId.price)
      }
      resolve(totalPrice)
    })


  })
  //  .then((totalPrice)=>{
  //   console.log(totalPrice)

  // })
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
    try {
      res.render("userViews/login", { msg: "", cartItemsCount: 0 });
    } catch (error) {

    }

  },
  // Renders Signup page
  goTosignUp: (req, res) => {
    try {
      res.render("userViews/signup", { msg: "", cartItemsCount: 0 });
    } catch (error) {

    }

  },
  // Sends user data to database for Registration
  sendToDatabase: async (req, res) => {
    try {
      const validEmail = EMAIL_REGEX.test(req.body.email);
      const validPassword = PASSWORD_REGEX.test(req.body.password);

      // Validates User input
      if (req.body.password === req.body.repeatPassword) {
        console.log("valid password");
        const userExist = await checkPhoneNumber(req.body.phone);

        if (userExist == true) {
          res.render("userViews/signup", {
            msg: "Phone Number already exists! Try again", cartItemsCount: 0
          });
        } else {
          if (!validEmail && !validPassword) {
            res.render("userViews/signup", {
              msg: "Invalid Email Format & Password", cartItemsCount: 0
            });
          } else if (!validEmail) {
            res.render("userViews/signup", { msg: "Invalid Email Format", cartItemsCount: 0 });
          } else if (!validPassword) {
            res.render("userViews/signup", {
              msg: "password= should be Minimum eight characters, at least one letter, one number and one special character",
              cartItemsCount: 0
            });
          } else {
            if (
              EMAIL_REGEX.test(req.body.email) &&
              PASSWORD_REGEX.test(req.body.password)
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
                msg: "Something went wrong!! Try Again", cartItemsCount: 0
              });
            }
          }
        }
      } else {
        console.log("password doesn't match");
        res.render("userViews/signup", {
          msg: "password doesn't match. Try Again", cartItemsCount: 0
        });
      }
    } catch (error) {
      res.render("userViews/signup", { msg: error, cartItemsCount: 0 });
    }
  },
  doLogin: async (req, res) => {
    try {
      // Checks with regex patterns
      if (
        EMAIL_REGEX.test(req.body.email) &&
        PASSWORD_REGEX.test(req.body.password)
      ) {
        const userDoc = await USER_MODEL.findOne({ email: req.body.email });
        if (userDoc.password == req.body.password) {
          if (userDoc.blockStatus == true) {
            res.render("userViews/login", { msg: "You were blocked by Admin", cartItemsCount: 0 });
          } else {
            req.session.user = userDoc._id;
            res.redirect("/");
          }
        } else {
          res.render("userViews/login", { msg: "Invalid credentials!!", cartItemsCount: 0 });
        }
      } else {
        if (
          EMAIL_REGEX.test(req.body.email) == false &&
          PASSWORD_REGEX.test(req.body.password) == false
        ) {
          res.render("userViews/login", { msg: "Invalid email or Password", cartItemsCount: 0 });
        } else if (EMAIL_REGEX.test(req.body.email) == false) {
          res.render("userViews/login", {
            msg: "Invalid credentials!! Enter a valid email Address", cartItemsCount: 0
          });
        } else if (PASSWORD_REGEX.test(req.body.password) == false) {
          res.render("userViews/login", {
            msg: "password should be Minimum eight characters, at least one letter, one number and one special character",
            cartItemsCount: 0
          });
        } else {
          res.render("userViews/login", { msg: "Something went wrong", cartItemsCount: 0 });
        }
      }
    } catch {
      res
        .status(400)
        .render("userViews/login", { msg: "invalid credentials!! Try Again", cartItemsCount: 0 });
    }
  },
  // shows page for OTP
  getPhoneNumber: (req, res) => {
    try {
      res.render("userViews/otpLogin", { cartItemsCount: 0 });
    } catch (error) {

    }
  },
  generateOtp: async (req, res) => {
    try {
      const userExist = await checkPhoneNumber(req.body.phone); // check phone Number exists on database

      // Generates random code if user Exists
      const randomCode = (function getRandomCode() {
        if (!userExist) {
          console.log("user does not exist on database");
          res.render("userViews/otpLogin", { cartItemsCount: 0 });
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
        await OTP_LOGIN_MODEL.findOneAndUpdate(
          { phone: req.body.phone },
          { code: randomCode },
          {
            new: true,
            upsert: true,
          }
        );

        const USER_PHONE_NUMBER = `+91` + req.body.phone;
        console.log(USER_PHONE_NUMBER);

        MY_OTP_SENDER(randomCode, USER_PHONE_NUMBER); // Sends email to user

        res.render("userViews/verify-otp", { data: req.body.phone, cartItemsCount: 0 }); // Renders page to verify OTP
      }
    } catch (error) {
      console.log(error);
    }
  },

  verifyOtp: async (req, res) => {
    try {
      console.log(req.body.phone);
      console.log(req.body.otp);
      const userCodeObj = await OTP_LOGIN_MODEL.findOne({
        phone: req.body.phone,
      });

      const userDoc = await USER_MODEL.findOne({ phone: req.body.phone });

      console.log("code from db Is:" + userCodeObj.code);
      if (req.body.otp == userCodeObj.code) {
        if (userCodeObj.blockStatus == true) {
          res.render("userViews/login", { msg: "You were blocked by Admin", cartItemsCount: 0 });
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
    try {
      if (req.session.user) {
        const products = await PRODUCT_MODEL.find({ isDeleted: false });
        // const CART_ITEMS_COUNT = await CART_MODEL.countDocuments
        // Checks user Cart Exists
        const USER_CART = await CART_MODEL.findOne({ userId: req.session.user })

        if (USER_CART) {
          cartItemsCount = USER_CART.items.length
          res.render("userViews/home", { products: products, cartItemsCount });
        } else {
          res.render("userViews/home", { products: products, cartItemsCount: 0 });
        }

      } else {
        res.redirect("/login");
      }
    } catch (error) {

    }
  },
  getProductInfo: (req, res) => {
    try {
      PRODUCT_MODEL.find({ _id: req.params.id }).then((info) => {
        console.log(info)
        res.render("userViews/productDetails", { info: info, cartItemsCount });
      });
    } catch (error) {

    }
  },
  doLogout: (req, res) => {
    try {
      // Destroys session
      req.session.destroy((error) => {
        if (error) {
          console.log(error);
        } else {
          console.log("logout successfully");
          res.redirect("/login");
        }
      });
    } catch (error) {

    }
  },

  viewCart: async (req, res) => {
    const USER_ID = req.session.user;
    try {
      // checks for products available in cart or not
      const RESULT = CART_MODEL.countDocuments({ userId: USER_ID })
        .then((count) => {
          return count;
        })
        .then(async (count) => {
          if (count < 1) {
            res.render("userViews/no-items", { cartItemsCount });
          } else {
            // Shows cart items
            let products = await CART_MODEL.findOne({ userId: USER_ID })
              .populate("items.productId")
              .lean();
            res.render("userViews/cart", { productDetails: products.items, cartItemsCount });
          }
        });
    } catch (error) {

    }
  },

  addToCart: async (req, res) => {
    try {
      const USER_ID = req.session.user;
      const USER = await CART_MODEL.findOne({ userId: USER_ID }); // checks user on db

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
      res.json({ status: true })
      // res.redirect("/cart");
    } catch (error) {

    }
  },

  incrementProduct: async (req, res) => {
    try {
      await addOneProduct(req.session.user, req.params.id).then(() => {
        getTotalPrice(req.session.user).then((totalPrice) => {
          console.log(totalPrice)
          res.json({ status: true, productId: req.params.id, totalPrice: totalPrice })
        })
      })
    } catch (error) {

    }
  },
  decrementProduct: async (req, res) => {
    try {
      await removeOneProduct(req.session.user, req.params.id).then((result) => {
        getTotalPrice(req.session.user).then((totalPrice) => {
          res.json({ status: true, productId: req.params.id, totalPrice: totalPrice })
        })
      })
    } catch (error) {

    }
  },
  viewEditQuantity: async (req, res) => {
    try {
      await CART_MODEL.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(req.session.user) } },
        { $unwind: "$items" },
        {
          $match: {
            "items.productId": new mongoose.Types.ObjectId(req.params.id),
          },
        },
      ]).then((result) => {
        res.render("userViews/edit-cart", { productInfo: result, cartItemsCount });
      });
    } catch (error) {

    }
  },
  updateQuantity: async (req, res) => {
    try {
      await CART_MODEL.updateOne(
        {
          userId: req.session.user,
          items: { $elemMatch: { productId: req.body.productId } },
        },
        { $set: { "items.$.quantity": req.body.quantity } }
      );
      res.redirect("/cart");
    } catch (error) {

    }
  },
  deleteCartItem: async (req, res) => {
    try {
      await CART_MODEL.updateMany(
        { userId: req.session.user },
        { $pull: { items: { productId: req.params.id } } }
      ).then(() => {
        res.redirect("/cart");
      });
    } catch (error) {

    }
  },
  viewCheckout: async (req, res) => {
    try {
      const USER_INFO = await USER_MODEL.findOne({ _id: req.session.user }).then(
        (userInfo) => {
          res.render("userViews/checkout", { address: userInfo.address, cartItemsCount });
        }
      );
    } catch (error) {

    }
  },
  viewAddAddress: (req, res) => {
    try {
      res.render("userViews/add-address", { cartItemsCount });
    } catch (error) {

    }
  },
  addAddress: async (req, res) => {
    try {
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
    } catch (error) {

    }
  },

  placeOrder: async (req, res) => {
    try {
      const USER_CART = await CART_MODEL.findOne({ userId: req.session.user }) //Finds user cart

      // Creates new Order
      ORDER_MODEL.create({
        userId: USER_CART.userId,
        payment_order_id: "",
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
        status: 'waiting for payment'
      }).then(() => {
        CART_MODEL.deleteOne({ userId: req.session.user }, (err) => {
          if (err) {
            console.log(err);
          }
        });
      })
      if (req.body.payment == 'razorpay') {
        console.log("checked razorpay")
        var options = {
          amount: 50000,  // amount in the smallest currency unit
          currency: "INR",
          receipt: "order_rcptid_11"
        };

        const order = await instance.orders.create(options, function (err, order) {
          if (err) {
            console.log(err)
          } else {
            console.log(order)
            ORDER_MODEL.updateOne({ userId: USER_CART.userId, status: 'waiting for payment' }, { payment_order_id: order.id }).then(() => {
              res.json({ status: true, order })
            })

          }

        })
      } else if (req.body.payment == 'cod') {
        let codRefId = USER_CART.userId
        // for COD 
        ORDER_MODEL.updateOne({ userId: USER_CART.userId, status: 'cod' }, { payment_order_id: USER_CART.userId }).then(() => {
          CART_MODEL.deleteOne({ userId: req.session.user }, (err) => {
            if (err) {
              console.log(err);
            }
          });
        }).then(() => {
          res.json({ status: 'cod', order: codRefId })
        })
      }
    } catch (error) {
      res.render('not-found', { layout: false })
    }
  },
  verifyPayment: async (req, res) => {
    try {
      const ORDER = await ORDER_MODEL.findOne({ userId: req.session.user, status: 'waiting for payment' })
      console.log("retrived from db is " + ORDER.payment_order_id)

      const ref_id = ORDER._id
      const razorpay_payment_id = req.body.razorpay_payment_id
      const secret = process.env.RAZORPAY_KEY_SECRET
      const razorpay_signature = req.body.razorpay_signature
      let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      hmac.update(req.body.razorpay_order_id + '|' + razorpay_payment_id)
      hmac = hmac.digest('hex')

      if (hmac == razorpay_signature) {
        console.log("payment is checked succussfull")
        res.json({ "signatureIsValid": true, ref_id: ref_id })
      } else {
        res.json({ "signatureIsValid": false, ref_id: ref_id })
      }
    } catch (error) {
      res.render('not-found', { layout: false })
    }
  },
  showPaymentSuccess: (req, res) => {
    try {
      const REF_ID = req.params.id
      res.render('userViews/payment-success', { REF_ID, cartItemsCount })
    } catch (error) {
      res.render('not-found', { layout: false })
    }
  },
  showPaymentFailed: (req, res) => {
    try {
      const REF_ID = req.params.id
      res.render('userViews/payment-fail', { REF_ID, cartItemsCount })
    } catch (error) {
      res.render('not-found', { layout: false })
    }
  },
  viewProfile: async (req, res) => {
    try {
      const USER_DATA = await USER_MODEL.findOne({ _id: req.session.user });
      res.render("userViews/profile", { userData: USER_DATA, cartItemsCount });
    } catch (error) {
      res.render('not-found', { layout: false })
    }
  },
  viewEditProfile: async (req, res) => {
    try {
      const USER_DATA = await USER_MODEL.findOne({ _id: req.session.user });
      res.render("userViews/edit-profile-info", { userData: USER_DATA, cartItemsCount });
    } catch (error) {

    }
  },
  editProfile: async (req, res) => {
    try {
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
    } catch (error) {

    }
  },
  viewEditAddress: (req, res) => {
    try {
      USER_MODEL.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.session.user) } },
        { $unwind: "$address" },
        { $match: { "address._id": new mongoose.Types.ObjectId(req.params.id) } },
      ]).then((doc) => {
        res.render("userViews/edit-address", { address: doc[0].address, cartItemsCount });
      });
    } catch (error) {

    }
  },
  editAddress: async (req, res) => {
    try {
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
    } catch (error) {

    }
  },
  profileViewAddAddress: (req, res) => {
    try {
      res.render("userViews/profile-add-address", { cartItemsCount });
    } catch (error) {

    }
  },
  addProfileAddress: async (req, res) => {
    try {
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
    } catch (error) {

    }
  },
  viewOrdersToUser: async (req, res) => {
    try {
      ORDER_MODEL.countDocuments({ userId: req.session.user })
        .then((count) => {
          return count;
        }).then(async (count) => {
          if (count < 1) {
            res.render("userViews/no-items", { cartItemsCount });
          } else {
            const ORDERS = await ORDER_MODEL.find({ userId: req.session.user })
              .populate("items.productId")
              .lean()
            return ORDERS
          }
        }).then((orderDetails) => {
          res.render("userViews/orders", { orderDetails, cartItemsCount });
        });
    } catch (error) {

    }
  },
  cancelOrderByUser: async (req, res) => {
    try {
      await ORDER_MODEL.updateOne(
        { _id: req.params.id },
        { $set: { status: "cancelled" } }
      ).then(() => {
        res.redirect("/orders");
      });
    } catch (error) {

    }
  },
  viewChangePassword: (req, res) => {
    try {
      res.render("userViews/change-password", { cartItemsCount });
    } catch (error) {

    }
  },
  changePassword: async (req, res) => {
    try {
      await USER_MODEL.updateOne(
        { _id: req.session.user },
        { $set: { password: req.body.password } }
      ).then(() => {
        res.redirect("/profile");
      });
    } catch (error) {

    }
  },
  showErrorPage: (req, res) => {
    res.render('not-found', { layout: false })
  }
};
