const ADMIN_MODEL = require("../model/adminSchema");
const USER_MODEL = require("../model/userSchema");
const PRODUCT_MODEL = require("../model/productSchema");
const CART_MODEL = require("../model/cartSchema");
const CATEGORY_MODEL = require("../model/categorySchema");
const ORDER_MODEL = require("../model/orderSchema");
const COUPON_MODEL = require("../model/couponSchema");
var cartItemsCount;
module.exports = {
  goToAdminHome: async (req, res) => {
    if (req.session.admin) {
      // Gets count of total Users
      const USER_COUNT = await USER_MODEL.countDocuments({});
      // Gets count of total Categories
      const CATEGORY_COUNT = await CATEGORY_MODEL.countDocuments({});
      // Gets count of total Products
      const PRODUCT_COUNT = await PRODUCT_MODEL.countDocuments({
        isDeleted: false,
      });
      // Gets count of total Orders
      const ORDER_COUNT = await ORDER_MODEL.countDocuments({});
      // Gets count of Total Coupons
      const COUPON_COUNT = await COUPON_MODEL.countDocuments({
        isDeleted: false,
      });

      const COUNT = {
        user: USER_COUNT,
        category: CATEGORY_COUNT,
        product: PRODUCT_COUNT,
        order: ORDER_COUNT,
        coupon: COUPON_COUNT,
      };
      res.render("adminViews/adminHome", {
        count: COUNT,
        layout: "layouts/adminLayout",
      });
    } else {
      res.redirect("/admin/login");
    }
  },
  goToAdminLogin: (req, res) => {
    res.render("adminViews/adminLogin", { layout: "layouts/adminLayout" });
  },
  doAdminLogin: async (req, res) => {
    try {
      const adminDoc = await ADMIN_MODEL.findOne({ email: req.body.email });
      if (adminDoc.password == req.body.password) {
        req.session.admin = req.body.email;
        res.redirect("/admin");
      } else {
        res.render("adminViews/adminLogin", { layout: "layouts/adminLayout" });
      }
    } catch (error) {
      res
        .status(400)
        .render("adminViews/adminLogin", { layout: "layouts/adminLayout" });
    }
  },
  listUsers: async (req, res) => {
    try {
      await USER_MODEL.find({}).then((users) => {
        if (req.session.blockInfo == true) {
          req.session.blockInfo = false;
          res.render("adminViews/users", {
            users: users,
            msg: "blocked succusfully",
            unblockmsg: "",
            layout: "layouts/adminLayout",
          });
        } else if (req.session.unblockInfo == true) {
          req.session.unblockInfo = false;
          res.render("adminViews/users", {
            users: users,
            unblockmsg: "Unblocked succusfully",
            msg: "",
            layout: "layouts/adminLayout",
          });
        } else {
          res.render("adminViews/users", {
            users: users,
            unblockmsg: "",
            msg: "",
            layout: "layouts/adminLayout",
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
  },
  blockUser: async (req, res) => {
    console.log(req.params.id);
    const updated = await USER_MODEL.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { blockStatus: true } }
    ).then(() => {
      console.log("user block on db");
      req.session.blockInfo = true;
      req.session.unblockInfo = false;
    });

    res.redirect("/admin/users");
  },
  unblockUser: async (req, res) => {
    await USER_MODEL.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { blockStatus: false } }
    ).then(() => {
      console.log("user unblock on db");
      req.session.unblockInfo = true;
      req.session.blockInfo = false;
    });
    res.redirect("/admin/users");
  },
  listProducts: async (req, res) => {
    try {
      await PRODUCT_MODEL.find({ isDeleted: false }).then((products) => {
        if (req.session.editProduct == true) {
          req.session.editProduct = false;
          res.render("adminViews/products", {
            products: products,
            msg: "Product Details Updated",
            layout: "layouts/adminLayout",
          });
        } else if (req.session.deleteStatus == true) {
          req.session.deleteStatus = false;
          res.render("adminViews/products", {
            products: products,
            msg: "Product Deleted",
            layout: "layouts/adminLayout",
          });
        } else {
          res.render("adminViews/products", {
            products: products,
            msg: "",
            layout: "layouts/adminLayout",
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
  },
  viewAddProduct: async (req, res) => {
    await CATEGORY_MODEL.find({}).then((categoryArr) => {
      console.log("got categories ");
      res.render("adminViews/add-product", {
        categories: categoryArr,
        layout: "layouts/adminLayout",
      });
    });
  },
  AddProduct: (req, res) => {
    console.log("the path is " + req.file.path);
    const IMAGE_PATH = req.file.path.slice(7);
    console.log("after cut " + IMAGE_PATH);
    PRODUCT_MODEL.create({
      name: req.body.name,
      image: IMAGE_PATH,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
    }).then(() => {
      console.log("product added");
      res.redirect("/admin/products");
    });
  },
  goToEditProduct: (req, res) => {
    PRODUCT_MODEL.find({ _id: req.params.id }).then((info) => {
      console.log(info);
      res.render("adminViews/edit-product", {
        info: info,
        layout: "layouts/adminLayout",
      });
    });
  },
  editProduct: async (req, res) => {
    await PRODUCT_MODEL.replaceOne(
      { _id: req.params.id },
      {
        name: req.body.name,
        image: req.body.image,
        description: req.body.description,
        price: req.body.price,
      }
    ).then(() => {
      req.session.editProduct = true;
      console.log("replaced");
    });
    res.redirect("/admin/products");
  },
  deleteProduct: async (req, res) => {
    //Update isDeleted feild to true
    PRODUCT_MODEL.updateOne(
      { _id: req.params.id },
      { $set: { isDeleted: true } }
    ).then(() => {
      console.log("product soft-deleted");
      req.session.deleteStatus = true;
      res.redirect("/admin/products");
    });

    await CART_MODEL.updateMany(
      {},
      { $pull: { items: { productId: req.params.id } } }
    );
  },
  ViewCategories: async (req, res) => {
    try {
      await CATEGORY_MODEL.find({}).then((all) => {
        if (req.session.categoryDeleted == true) {
          req.session.categoryDeleted = false;
          res.render("adminViews/categories", {
            categories: all,
            message: "Category Deleted successfully",
            layout: "layouts/adminLayout",
          });
        } else {
          res.render("adminViews/categories", {
            categories: all,
            message: "",
            layout: "layouts/adminLayout",
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
  },
  viewAddCategory: (req, res) => {
    res.render("adminViews/add-category", { layout: "layouts/adminLayout" });
  },
  addCategory: async (req, res) => {
    const CATEGORY_IN_SMALL_LETTERS = req.body.category.toLowerCase();
    // Check Category already exists on Categories
    const CATEGORY_EXIST = await CATEGORY_MODEL.exists({
      category_name: CATEGORY_IN_SMALL_LETTERS,
    }).then((result) => {
      return result;
    });

    // if category not Exists on Database add category
    if (CATEGORY_EXIST == null) {
      await CATEGORY_MODEL.create({
        category_name: CATEGORY_IN_SMALL_LETTERS,
      }).then(() => {
        console.log("category changed");
      });
    } else {
      console.log("category exists already");
    }
    res.redirect("/admin/categories");
  },
  viewEditCategory: async (req, res) => {
    await CATEGORY_MODEL.findOne({ _id: req.params.id }).then((item) => {
      console.log(item);
      res.render("adminViews/edit-category", {
        data: item,
        layout: "layouts/adminLayout",
      });
    });
  },
  editCategory: async (req, res) => {
    await CATEGORY_MODEL.replaceOne(
      { _id: req.params.id },
      { category_name: req.body.category }
    ).then(() => {
      res.redirect("/admin/categories");
    });
  },
  deleteCategory: async (req, res) => {
    await CATEGORY_MODEL.deleteOne({ _id: req.params.id }).then(() => {
      req.session.categoryDeleted = true;
      res.redirect("/admin/categories");
    });
  },

  doAdminLogout: (req, res) => {
    // Destroys session
    req.session.destroy((error) => {
      if (error) {
        console.log(error);
      } else {
        console.log("logout successfully");
        res.redirect("/admin/");
      }
    });
  },
  viewOrders: (req, res) => {
    ORDER_MODEL.find({})
      .populate("userId")
      .populate("items.productId")
      .then((orders) => {
        if (req.session.orderCancelled == true) {
          req.session.orderCancelled = false;
          res.render("adminViews/orders", {
            orders,
            message: "Order Cancelled successfully",
            layout: "layouts/adminLayout",
          });
        } else {
          res.render("adminViews/orders", {
            orders,
            message: "",
            layout: "layouts/adminLayout",
          });
        }
      });
  },
  viewChangeStatus: (req, res) => {
    res.render("adminViews/change-status", {
      orderId: req.params.id,
      layout: "layouts/adminLayout",
    });
  },
  changeStatus: async (req, res) => {
    await ORDER_MODEL.updateOne(
      { _id: req.body.orderId },
      { $set: { status: req.body.status } }
    ).then(() => {
      res.redirect("/admin/orders");
    });
  },
  cancelOrder: async (req, res) => {
    await ORDER_MODEL.updateOne(
      { _id: req.params.id },
      { $set: { status: "cancelled" } }
    ).then(() => {
      req.session.orderCancelled = true;
      res.redirect("/admin/orders");
    });
  },
  viewCoupons: async (req, res) => {
    const ALL_COUPONS = await COUPON_MODEL.find({ isDeleted: false });
    res.render("adminViews/coupons", {
      layout: "layouts/adminLayout",
      coupons: ALL_COUPONS,
    });
  },
  viewAddCoupon: (req, res) => {
    res.render("adminViews/add-coupon", { layout: "layouts/adminLayout" });
  },
  addCoupon: async (req, res) => {
    // Check coupon Code exists
    const COUPON_EXIST = await COUPON_MODEL.exists({
      coupon_code: req.body.couponCode,
    });
    // if Coupon doesn't Exist Add coupon to Database
    if (COUPON_EXIST == null) {
      await COUPON_MODEL.create({
        coupon_code: req.body.couponCode,
        discount: req.body.couponDiscount,
        discountLimit: req.body.discountLimit,
        purchaseLimit: req.body.purchaseLimit,
      });
    }
    // Redirect to Coupons page
    res.redirect("/admin/coupons");
  },
  deleteCoupon: async (req, res) => {
    await COUPON_MODEL.updateOne(
      { _id: req.params.id },
      { $set: { isDeleted: true } }
    );
    res.redirect("/admin/coupons");
  },
};
