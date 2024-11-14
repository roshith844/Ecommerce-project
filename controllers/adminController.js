const PATH = require("path");
const ADMIN_MODEL = require("../model/adminSchema");
const USER_MODEL = require("../model/userSchema");
const PRODUCT_MODEL = require("../model/productSchema");
const CART_MODEL = require("../model/cartSchema");
const CATEGORY_MODEL = require("../model/categorySchema");
const ORDER_MODEL = require("../model/orderSchema");
const COUPON_MODEL = require("../model/couponSchema");
const BANNER_MODEL = require("../model/bannerSchema");
require("fs");
const ExcelJS = require("exceljs");
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

      const PENDING_ORDERS = await ORDER_MODEL.countDocuments({
        status: "pending",
      });
      const PLACED_ORDERS = await ORDER_MODEL.countDocuments({
        status: "order placed",
      });

      const SHIPPED_ORDERS = await ORDER_MODEL.countDocuments({
        status: "shipped",
      });
      const DELIVERED_ORDERS = await ORDER_MODEL.countDocuments({
        status: "delivered",
      });
      const CANCELLED_ORDERS = await ORDER_MODEL.countDocuments({
        status: "cancelled",
      });

      const COUNT = {
        user: USER_COUNT,
        category: CATEGORY_COUNT,
        product: PRODUCT_COUNT,
        order: {
          total: ORDER_COUNT,
          pending: PENDING_ORDERS,
          placed: PLACED_ORDERS,
          shipped: SHIPPED_ORDERS,
          delivered: DELIVERED_ORDERS,
          cancelled: CANCELLED_ORDERS,
        },
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
    res.render("adminViews/adminLogin", {
      layout: "layouts/adminLayout",
      msg: "",
    });
  },
  doAdminLogin: async (req, res) => {
    try {
      const adminDoc = await ADMIN_MODEL.findOne({ email: req.body.email });
      if (!adminDoc) {
        res.render("adminViews/adminLogin", {
          layout: "layouts/adminLayout",
          msg: "invalid credentials",
        });
      } else if (adminDoc.password === req.body.password) {
        req.session.admin = req.body.email;
        res.redirect("/admin");
      } else {
        res.render("adminViews/adminLogin", {
          layout: "layouts/adminLayout",
          msg: "invalid credentials",
        });
      }
    } catch (error) {
      res.status(400).render("adminViews/adminLogin", {
        layout: "layouts/adminLayout",
        msg: "something went wrong",
      });
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
    const updated = await USER_MODEL.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { blockStatus: true } }
    ).then(() => {
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
      res.render("adminViews/add-product", {
        categories: categoryArr,
        layout: "layouts/adminLayout",
      });
    });
  },
  AddProduct: (req, res) => {
    const IMAGE_PATH = req.file.path.slice(7);
    PRODUCT_MODEL.create({
      name: req.body.name,
      image: IMAGE_PATH,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
    }).then(() => {
      res.redirect("/admin/products");
    });
  },
  goToEditProduct: (req, res) => {
    PRODUCT_MODEL.find({ _id: req.params.id }).then((info) => {
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
    });
    res.redirect("/admin/products");
  },
  deleteProduct: async (req, res) => {
    PRODUCT_MODEL.updateOne(
      { _id: req.params.id },
      { $set: { isDeleted: true } }
    ).then(() => {
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
      });
    } else {
    }
    res.redirect("/admin/categories");
  },
  viewEditCategory: async (req, res) => {
    await CATEGORY_MODEL.findOne({ _id: req.params.id }).then((item) => {
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
        res.redirect("/admin/");
      }
    });
  },
  viewOrders: (req, res) => {
    ORDER_MODEL.find({})
      .sort({ date: -1 })
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
  viewOrderDetails: async (req, res) => {
    const ORDERS = await ORDER_MODEL.findOne({ _id: req.params.id })
      .populate("items.productId")
      .lean();
    res.render("userViews/orderDetails", {
      orderDetails: ORDERS,
      cartItemsCount,
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
        expiryDate: new Date(req.body.expiryDate),
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

  viewBanners: async (req, res) => {
    const BANNERS = await BANNER_MODEL.find({ isDeleted: false });
    res.render("adminViews/banners", {
      layout: "layouts/adminLayout",
      banners: BANNERS,
    });
  },
  viewAddBanner: (req, res) => {
    res.render("adminViews/add-banner", { layout: "layouts/adminLayout" });
  },
  addBanner: async (req, res) => {
    const IMAGE_PATH = req.file.path.slice(7);
    await BANNER_MODEL.create({
      heading: req.body.heading,
      description: req.body.description,
      image: IMAGE_PATH,
    });

    res.redirect("/admin/banners");
  },
  deleteBanner: async (req, res) => {
    await BANNER_MODEL.updateOne(
      { _id: req.params.id },
      { $set: { isDeleted: true } }
    );
    res.redirect("/admin/banners");
  },
  getSalesReport: async (req, res) => {
    try {
      const START_DATE = new Date(req.body.startDate);
      const END_DATE = new Date(req.body.endDate);
      const SALES_INFO = await ORDER_MODEL.find({
        $and: [
          { date: { $gte: START_DATE } },
          { status: "delivered" },
          { date: { $lte: END_DATE } },
        ],
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("My Sheet");

      worksheet.columns = [
        { header: "userId", key: "userId", width: 10 },
        { header: "payment_order_id", key: "payment_order_id", width: 32 },
        { header: "items", key: "items", width: 10, outlineLevel: 1 },
        { header: "amount", key: "amount", width: 10, outlineLevel: 1 },
        {
          header: "payment_method",
          key: "payment_method",
          width: 10,
          outlineLevel: 1,
        },
        { header: "date", key: "date", width: 10, outlineLevel: 1 },
        { header: "status", key: "status", width: 10, outlineLevel: 1 },
      ];

      SALES_INFO.forEach((order) => {
        worksheet.addRow({
          userId: order.userId,
          payment_order_id: order.payment_order_id,
          items: order.items,
          address: order.address,
          payment_method: order.payment_method,
          date: order.date.toDateString(),
          status: order.status,
        });
      });
      await workbook.xlsx.writeFile("order.xlsx").then((data) => {
        const DATA_LOCATION = PATH.join(__dirname, "../order.xlsx");
        res.download(DATA_LOCATION);
      });
    } catch (error) {
      console.log(error);
    }
  },
};
