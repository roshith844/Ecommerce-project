const crypto = require("crypto");
const mongoose = require("mongoose");
const MY_OTP_SENDER = require("../model/sendOTP");
const USER_MODEL = require("../model/userSchema");
const OTP_LOGIN_MODEL = require("../model/otpLoginSchema");
const PRODUCT_MODEL = require("../model/productSchema");
const CART_MODEL = require("../model/cartSchema");
const WISHLIST_MODEL = require("../model/wishlistSchema");
const BANNER_MODEL = require("../model/bannerSchema");
const ORDER_MODEL = require("../model/orderSchema");
const COUPON_MODEL = require("../model/couponSchema");
const EMAIL_REGEX = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/; // Pattern for Minimum eight characters, at least one letter, one number and one special character
const Razorpay = require("razorpay");
var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// To increment by one on cart
async function addOneProduct(userId, productId) {
  await CART_MODEL.updateOne(
    { userId: userId, items: { $elemMatch: { productId: productId } } },
    { $inc: { "items.$.quantity": 1 } }
  );
}

// To Decrement by one on cart
async function removeOneProduct(userId, productId) {
  const QUANTITY = await CART_MODEL.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        items: {
          $elemMatch: { productId: mongoose.Types.ObjectId(productId) },
        },
      },
    },
    { $unwind: "$items" },
    { $match: { "items.productId": mongoose.Types.ObjectId(productId) } },
  ]).then((result) => {
    return result;
  });
  if (QUANTITY[0].items.quantity != 1) {
    await CART_MODEL.updateOne(
      { userId: userId, items: { $elemMatch: { productId: productId } } },
      { $inc: { "items.$.quantity": -1 } }
    );
  } else {
    return false;
  }
}

// Calculates Total Price of Cart items
function getTotalPrice(userId) {
  return new Promise((resolve, reject) => {
    CART_MODEL.findOne({ userId: userId })
      .populate("items.productId")
      .lean()
      .then((result) => {
        let totalPrice = 0;
        for (let i = 0; i < result.items.length; i++) {
          totalPrice +=
            result.items[i].quantity * result.items[i].productId.price;
        }
        resolve(totalPrice);
      });
  });
}
// checks Phone Number exists on database
async function checkPhoneNumber(userPhoneNumber) {
  const PHONE_NUMBER_AS_INTEGER = Number(userPhoneNumber);
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
      res.render("userViews/login", {
        msg: "",
        layout: "layouts/guest-layout",
      });
    } catch (error) {}
  },
  // Renders Signup page
  goTosignUp: (req, res) => {
    try {
      res.render("userViews/signup", {
        msg: "",
        layout: "layouts/guest-layout",
      });
    } catch (error) {}
  },
  // Sends user data to database for Registration
  sendToDatabase: async (req, res) => {
    try {
      const validEmail = EMAIL_REGEX.test(req.body.email);
      const validPassword = PASSWORD_REGEX.test(req.body.password);

      // Validates User input
      if (req.body.password === req.body.repeatPassword) {
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
            res.render("userViews/signup", {
              msg: "Invalid Email Format",
            });
          } else if (!validPassword) {
            res.render("userViews/signup", {
              msg: "password= should be Minimum eight characters, at least one letter, one number and one special character",
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
                // res.redirect("/");
                res.render("userViews/signup", {
                  msg: "Signed Up successfully",
                  layout: "layouts/guest-layout",
                });
              });
            } else {
              res.render("userViews/signup", {
                msg: "Something went wrong!! Try Again",
                layout: "layouts/guest-layout",
              });
            }
          }
        }
      } else {
        res.render("userViews/signup", {
          msg: "password doesn't match. Try Again",
          layout: "layouts/guest-layout",
        });
      }
    } catch (error) {
      res.render("userViews/signup", {
        msg: error,
        layout: "layouts/guest-layout",
      });
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
            res.render("userViews/login", {
              msg: "You were blocked by Admin",
            });
          } else {
            req.session.user = userDoc._id;
            res.redirect("/");
          }
        } else {
          res.render("userViews/login", {
            msg: "Invalid credentials!!",
          });
        }
      } else {
        if (
          EMAIL_REGEX.test(req.body.email) == false &&
          PASSWORD_REGEX.test(req.body.password) == false
        ) {
          res.render("userViews/login", {
            msg: "Invalid email or Password",
          });
        } else if (EMAIL_REGEX.test(req.body.email) == false) {
          res.render("userViews/login", {
            msg: "Invalid credentials!! Enter a valid email Address",
          });
        } else if (PASSWORD_REGEX.test(req.body.password) == false) {
          res.render("userViews/login", {
            msg: "password should be Minimum eight characters, at least one letter, one number and one special character",
          });
        } else {
          res.render("userViews/login", {
            msg: "Something went wrong",
          });
        }
      }
    } catch {
      res.status(400).render("userViews/login", {
        msg: "invalid credentials!! Try Again",
      });
    }
  },
  // shows page for OTP
  getPhoneNumber: (req, res) => {
    try {
      res.render("userViews/otpLogin", {
        layout: "layouts/guest-layout",
      });
    } catch (error) {}
  },
  generateOtp: async (req, res) => {
    try {
      const userExist = await checkPhoneNumber(req.body.phone); // check phone Number exists on database

      // Generates random code if user Exists
      const randomCode = (function getRandomCode() {
        if (!userExist) {
          res.render("userViews/otpLogin");
          return false;
        } else {
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

        MY_OTP_SENDER(randomCode, USER_PHONE_NUMBER); // Sends email to user

        res.render("userViews/verify-otp", {
          data: req.body.phone,
        }); // Renders page to verify OTP
      }
    } catch (error) {
      console.log(error);
    }
  },

  verifyOtp: async (req, res) => {
    try {
      const userCodeObj = await OTP_LOGIN_MODEL.findOne({
        phone: req.body.phone,
      });

      const userDoc = await USER_MODEL.findOne({ phone: req.body.phone });

      if (req.body.otp == userCodeObj.code) {
        if (userCodeObj.blockStatus == true) {
          res.render("userViews/login", {
            msg: "You were blocked by Admin",
          });
        } else {
          req.session.user = userDoc._id;
          res.redirect("/");
        }
      } else {
        res.redirect("/login");
      }
    } catch (error) {}
  },
  goHome: async (req, res) => {
    try {
      if (req.session.user) {
        const products = await PRODUCT_MODEL.find({ isDeleted: false });
        const BANNERS = await BANNER_MODEL.find({ isDeleted: false });
        // Checks user Cart Exists
        const USER_CART = await CART_MODEL.findOne({
          userId: req.session.user,
        });

        if (USER_CART) {
          res.render("userViews/home", {
            products: products,
            banners: BANNERS,
          });
        } else {
          res.render("userViews/home", {
            products: products,
            banners: BANNERS,
          });
        }
      } else {
        res.redirect("/login");
      }
    } catch (error) {}
  },
  getProductInfo: (req, res) => {
    try {
      PRODUCT_MODEL.find({ _id: req.params.id }).then((info) => {
        res.render("userViews/productDetails", { info: info });
      });
    } catch (error) {}
  },
  doLogout: (req, res) => {
    try {
      // Destroys session
      req.session.destroy((error) => {
        if (error) {
          console.log(error);
        } else {
          res.redirect("/login");
        }
      });
    } catch (error) {}
  },
  viewWishlist: async (req, res) => {
    const USER_ID = req.session.user;
    try {
      // checks for products available in cart or not
      const RESULT = WISHLIST_MODEL.countDocuments({ userId: USER_ID })
        .then((count) => {
          return count;
        })
        .then(async (count) => {
          if (count < 1) {
            res.render("userViews/no-items");
          } else {
            // Shows cart items
            let products = await WISHLIST_MODEL.findOne({ userId: USER_ID })
              .populate("items.productId")
              .lean();
            res.render("userViews/wishlist", {
              productDetails: products.items,
            });
          }
        });
    } catch (error) {}
  },
  addToWishlist: async (req, res) => {
    try {
      const USER_ID = req.session.user;
      const USER_WISHLIST = await WISHLIST_MODEL.findOne({ userId: USER_ID }); // checks user on db
      // Checks if user have a wishlist on database
      if (USER_WISHLIST) {
        const PRODUCT_EXIST_ON_CART = await CART_MODEL.findOne({
          userId: USER_ID,
          items: { $elemMatch: { productId: req.params.id } },
        });
        const PRODUCT_EXIST_ON_WISHLIST = await WISHLIST_MODEL.findOne({
          userId: USER_ID,
          items: { $elemMatch: { productId: req.params.id } },
        });
        // Checks product exist on cart and wishlist
        if (!PRODUCT_EXIST_ON_CART && !PRODUCT_EXIST_ON_WISHLIST) {
          await WISHLIST_MODEL.updateOne(
            { userId: USER_ID },
            { $push: { items: { productId: req.params.id } } }
          );
          res.json({ status: true, isOnCart: false, isOnWishlist: false });
        } else {
          if (PRODUCT_EXIST_ON_CART) {
            res.json({ status: true, isOnCart: true, isOnWishlist: false });
          } else if (PRODUCT_EXIST_ON_WISHLIST) {
            res.json({ status: true, isOnCart: false, isOnWishlist: true });
          }
        }

        // if user doesnot has a cart, Create new cart
      } else {
        const PRODUCT_EXIST_ON_CART = await CART_MODEL.findOne({
          userId: USER_ID,
          items: { $elemMatch: { productId: req.params.id } },
        });
        if (!PRODUCT_EXIST_ON_CART) {
          await WISHLIST_MODEL.create({
            userId: USER_ID,
            items: [
              {
                productId: req.params.id,
                quantity: 1,
              },
            ],
          });
          res.json({ status: true, isOnCart: false, isOnWishlist: false });
        } else {
          res.json({ status: true, isOnCart: true, isOnWishlist: false });
        }
      }
      // res.json({ status: true });
      // res.redirect("/cart");
    } catch (error) {
      console.log(error);
    }
  },
  deleteWishlistItem: async (req, res) => {
    try {
      await WISHLIST_MODEL.updateMany(
        { userId: req.session.user },
        { $pull: { items: { productId: req.params.id } } }
      ).then(() => {
        res.redirect("/wishlist");
      });
    } catch (error) {}
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
            res.render("userViews/no-items");
          } else {
            // Shows cart items
            let products = await CART_MODEL.findOne({ userId: USER_ID })
              .populate("items.productId")
              .lean();
            res.render("userViews/cart", {
              productDetails: products.items,
            });
          }
        });
    } catch (error) {}
  },
  addToCart: async (req, res) => {
    try {
      const USER_ID = req.session.user;
      const USER = await CART_MODEL.findOne({ userId: USER_ID }); // checks user on db
      // Checking weather user has a cart or not
      if (USER) {
        // checks product exists on cart
        const PRODUCT_EXIST = await CART_MODEL.findOne({
          userId: USER_ID,
          items: { $elemMatch: { productId: req.params.id } },
        });
        if (PRODUCT_EXIST) {
          addOneProduct(USER_ID, req.params.id);
          // if product is not there, Adds the product to cart
        } else {
          await CART_MODEL.updateOne(
            { userId: USER_ID },
            { $push: { items: { productId: req.params.id } } }
          );
        }
        await WISHLIST_MODEL.updateMany(
          { userId: req.session.user },
          { $pull: { items: { productId: req.params.id } } }
        );
        // if user doesnot has a cart, Create new cart
      } else {
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
      res.json({ status: true });
      // res.redirect("/cart");
    } catch (error) {
      console.log(error);
    }
  },

  incrementProduct: async (req, res) => {
    try {
      await addOneProduct(req.session.user, req.params.id).then(() => {
        getTotalPrice(req.session.user).then((totalPrice) => {
          res.json({
            status: true,
            productId: req.params.id,
            totalPrice: totalPrice,
          });
        });
      });
    } catch (error) {}
  },
  decrementProduct: async (req, res) => {
    try {
      await removeOneProduct(req.session.user, req.params.id).then((result) => {
        getTotalPrice(req.session.user).then((totalPrice) => {
          res.json({
            status: true,
            productId: req.params.id,
            totalPrice: totalPrice,
          });
        });
      });
    } catch (error) {}
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
        res.render("userViews/edit-cart", {
          productInfo: result,
        });
      });
    } catch (error) {}
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
    } catch (error) {}
  },
  deleteCartItem: async (req, res) => {
    try {
      await CART_MODEL.updateMany(
        { userId: req.session.user },
        { $pull: { items: { productId: req.params.id } } }
      ).then(() => {
        res.redirect("/cart");
      });
    } catch (error) {}
  },
  viewCheckout: async (req, res) => {
    try {
      const USER_INFO = await USER_MODEL.findOne({
        _id: req.session.user,
      }).then((userInfo) => {
        res.render("userViews/checkout", {
          address: userInfo.address,
        });
      });
    } catch (error) {}
  },
  viewAddAddress: (req, res) => {
    try {
      res.render("userViews/add-address");
    } catch (error) {}
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
    } catch (error) {}
  },

  placeOrder: async (req, res) => {
    try {
      // Find Total Price of products on the Cart
      const TOTAL_PRICE = await CART_MODEL.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(req.session.user) } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $project: {
            userId: 1,
            product_price: "$product.price",
            quantity: "$items.quantity",
          },
        },
        {
          $unwind: "$product_price",
        },
        {
          $addFields: {
            total_price_of_item: { $multiply: ["$product_price", "$quantity"] },
          },
        },
      ]).exec();

      // Calculate total amount
      let TOTAL_AMOUNT = TOTAL_PRICE.reduce((accumulator, itemObj) => {
        return accumulator + itemObj.total_price_of_item;
      }, 0);

      // Checks coupon Code
      const COUPON_DOC = await COUPON_MODEL.findOne({
        coupon_code: req.body.coupon,
      });
      if (COUPON_DOC != null) {
        const DISCOUNT = COUPON_DOC.discount;
        let DISCOUNT_AMOUNT = Math.floor(TOTAL_AMOUNT * (DISCOUNT / 100));
        const CURRENT_DATE = new Date();
        if (
          TOTAL_AMOUNT <= COUPON_DOC.purchaseLimit &&
          CURRENT_DATE <= COUPON_DOC.expiryDate
        ) {
          if (DISCOUNT_AMOUNT >= COUPON_DOC.discountLimit) {
            DISCOUNT_AMOUNT = COUPON_DOC.discountLimit;
          }
          // Calculates Total Amount to Discount
          TOTAL_AMOUNT = Math.floor(TOTAL_AMOUNT - DISCOUNT_AMOUNT);
        } else {
        }
      } else {
      }

      const USER_CART = await CART_MODEL.findOne({ userId: req.session.user }); //Finds user cart
      // Creates new Order
      await ORDER_MODEL.create({
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
        amount: TOTAL_AMOUNT,
        status: "pending",
      }).then(() => {
        CART_MODEL.deleteOne({ userId: req.session.user }, (err) => {
          if (err) {
            console.log(err);
          }
        });
      });

      if (req.body.payment == "razorpay") {
        var options = {
          amount: TOTAL_AMOUNT * 100, // amount in the smallest currency unit
          currency: "INR",
          receipt: "order_rcptid_11",
        };
        const order = await instance.orders.create(
          options,
          async (err, order) => {
            if (err) {
              console.log(err);
            } else {
              await ORDER_MODEL.updateOne(
                { userId: USER_CART.userId, status: "pending" },
                { payment_order_id: order.id, amount: TOTAL_AMOUNT }
              ).then(() => {
                res.json({
                  status: "online",
                  order,
                  key: process.env.RAZORPAY_KEY_ID,
                });
              });
            }
          }
        );
      } else if (req.body.payment == "cod") {
        let codRefId = USER_CART.userId.toString();
        // for COD
        await ORDER_MODEL.updateOne(
          { userId: USER_CART.userId, status: "pending" },
          { payment_order_id: USER_CART.userId, status: "order placed" }
        );

        res.json({ status: "cod", order: codRefId });
      }
    } catch (error) {
      console.log(error);
      res.render("not-found", { layout: false });
    }
  },
  verifyPayment: async (req, res) => {
    try {
      const ORDER = await ORDER_MODEL.findOne({
        userId: req.session.user,
        status: "pending",
      }).then(async (ORDER) => {
        const ref_id = ORDER._id;
        const razorpay_payment_id = req.body.razorpay_payment_id;
        const razorpay_signature = req.body.razorpay_signature;
        let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(req.body.razorpay_order_id + "|" + razorpay_payment_id);
        hmac = hmac.digest("hex");
        if (hmac == razorpay_signature) {
          await ORDER_MODEL.updateOne(
            { userId: req.session.user, status: "pending" },
            {
              payment_order_id: req.body.razorpay_order_id,
              status: "order placed",
            }
          ).then(() => {
            res.json({ signatureIsValid: true, ref_id: ref_id });
          });
        } else {
          res.json({ signatureIsValid: false, ref_id: ref_id });
        }
      });
    } catch (error) {
      res.render("not-found", { layout: false });
    }
  },
  showPaymentSuccess: (req, res) => {
    try {
      const REF_ID = req.params.id;
      res.render("userViews/payment-success", { REF_ID });
    } catch (error) {
      res.render("not-found", { layout: false });
    }
  },
  showPaymentFailed: (req, res) => {
    try {
      const REF_ID = req.params.id;
      res.render("userViews/payment-fail", { REF_ID });
    } catch (error) {
      res.render("not-found", { layout: false });
    }
  },
  viewProfile: async (req, res) => {
    try {
      const USER_DATA = await USER_MODEL.findOne({ _id: req.session.user });
      res.render("userViews/profile", { userData: USER_DATA });
    } catch (error) {
      res.render("not-found", { layout: false });
    }
  },
  viewEditProfile: async (req, res) => {
    try {
      const USER_DATA = await USER_MODEL.findOne({ _id: req.session.user });
      res.render("userViews/edit-profile-info", {
        userData: USER_DATA,
      });
    } catch (error) {}
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
    } catch (error) {}
  },
  viewEditAddress: (req, res) => {
    try {
      USER_MODEL.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.session.user) } },
        { $unwind: "$address" },
        {
          $match: { "address._id": new mongoose.Types.ObjectId(req.params.id) },
        },
      ]).then((doc) => {
        res.render("userViews/edit-address", {
          address: doc[0].address,
        });
      });
    } catch (error) {}
  },
  editAddress: async (req, res) => {
    try {
      // Updates address details inside array using Object id of inner-object to change
      await USER_MODEL.updateOne(
        {
          _id: req.session.user,
          address: { $elemMatch: { _id: req.body.id } },
        },
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
    } catch (error) {}
  },
  profileViewAddAddress: (req, res) => {
    try {
      res.render("userViews/profile-add-address");
    } catch (error) {}
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
    } catch (error) {}
  },
  viewOrdersToUser: async (req, res) => {
    try {
      ORDER_MODEL.countDocuments({ userId: req.session.user })
        .then((count) => {
          return count;
        })
        .then(async (count) => {
          if (count < 1) {
            res.render("userViews/no-items");
          } else {
            const ORDERS = await ORDER_MODEL.find({
              userId: req.session.user,
              status: { $ne: "cancelled" },
            })
              .populate("items.productId")
              .sort({ date: -1 })
              .lean();

            const CANCELLED_ORDERS = await ORDER_MODEL.find({
              userId: req.session.user,
              status: "cancelled",
            }).sort({ date: -1 })
              .populate("items.productId")
              .lean();

            return { ORDERS, CANCELLED_ORDERS };
          }
        })
        .then((result) => {
          let orderDetails = [];
          let cancelledOrderDetails = [];
          if (result) {
            orderDetails = result.ORDERS;
            cancelledOrderDetails = result.CANCELLED_ORDERS;
            res.render("userViews/orders", {
              orderDetails,
              cancelledOrderDetails,
            });
          }
        });
    } catch (error) {}
  },
  viewOrderDetails: async (req, res) => {
    const ORDERS = await ORDER_MODEL.findOne({ _id: req.params.id })
      .populate("items.productId")
      .lean();
    res.render("userViews/orderDetails", {
      orderDetails: ORDERS,
    });
  },
  cancelOrderByUser: async (req, res) => {
    try {
      await ORDER_MODEL.updateOne(
        { _id: req.params.id },
        { $set: { status: "cancelled" } }
      ).then(() => {
        res.redirect("/orders");
      });
    } catch (error) {}
  },
  viewChangePassword: (req, res) => {
    try {
      res.render("userViews/change-password");
    } catch (error) {}
  },
  changePassword: async (req, res) => {
    try {
      await USER_MODEL.updateOne(
        { _id: req.session.user },
        { $set: { password: req.body.password } }
      ).then(() => {
        res.redirect("/profile");
      });
    } catch (error) {}
  },
  showErrorPage: (req, res) => {
    res.render("not-found", { layout: false });
  },
};
