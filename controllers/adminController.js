const adminModel = require("../model/adminSchema");
const UserModel = require("../model/userSchema");
const productModel = require("../model/productSchema");
const CART_MODEL = require("../model/cartSchema");
const categoryModel = require("../model/categorySchema");
const ORDER_MODEL = require("../model/orderSchema");
const session = require("express-session");
const cookieParser = require("cookie-parser");

module.exports = {
  goToAdminHome: (req, res) => {
    if (req.session.admin) {
      res.render("adminViews/adminHome", { layout: false });
    } else {
      res.redirect("/admin/login");
    }
  },
  goToAdminLogin: (req, res) => {
    res.render("adminViews/adminLogin", { layout: "layouts/adminLayout" });
  },
  doAdminLogin: async (req, res) => {
    try {
      const adminDoc = await adminModel.findOne({ email: req.body.email });
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
      await UserModel.find({}).then((users) => {
        if (req.session.blockInfo == true) {
          req.session.blockInfo = false;
          res.render("adminViews/users", {
            users: users,
            msg: "blocked succusfully",
            unblockmsg: "",
          });
        } else if (req.session.unblockInfo == true) {
          req.session.unblockInfo = false;
          res.render("adminViews/users", {
            users: users,
            unblockmsg: "Unblocked succusfully",
            msg: "",
          });
        } else {
          res.render("adminViews/users", {
            users: users,
            unblockmsg: "",
            msg: "",
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
  },
  blockUser: async (req, res) => {
    console.log(req.params.id);
    const updated = await UserModel.findOneAndUpdate(
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
    await UserModel.findOneAndUpdate(
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
      await productModel.find({}).then((products) => {
        if (req.session.editProduct == true) {
          req.session.editProduct = false;
          res.render("adminViews/products", {
            products: products,
            msg: "Product Details Updated",
          });
        } else if (req.session.deleteStatus == true) {
          req.session.deleteStatus = false;
          res.render("adminViews/products", {
            products: products,
            msg: "Product Deleted",
          });
        } else {
          res.render("adminViews/products", { products: products, msg: "" });
        }
      });
    } catch (error) {
      console.log(error);
    }
  },
  viewAddProduct: async (req, res) => {
    await categoryModel.find({}).then((categoryArr) => {
      console.log("got categories ");
      res.render("adminViews/add-product", { categories: categoryArr });
    });
  },
  AddProduct: (req, res) => {
    productModel
      .create({
        name: req.body.name,
        image: req.body.image,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
      })
      .then(() => {
        console.log("product added");
        res.redirect("/admin/products");
      });
  },
  goToEditProduct: (req, res) => {
    productModel.find({ _id: req.params.id }).then((info) => {
      console.log(info);
      res.render("adminViews/edit-product", { info: info });
    });
  },
  editProduct: async (req, res) => {
    await productModel
      .replaceOne(
        { _id: req.params.id },
        {
          name: req.body.name,
          image: req.body.image,
          description: req.body.description,
          price: req.body.price,
        }
      )
      .then(() => {
        req.session.editProduct = true;
        console.log("replaced");
      });
    res.redirect("/admin/products");
  },
  deleteProduct: async (req, res) => {
    // Deletes Product from Products collection
    await productModel.deleteOne({ _id: req.params.id }).then(() => {
      console.log("product deleted");
      req.session.deleteStatus = true;
      res.redirect("/admin/products");
    });

    // Deletes Product from users cart (carts collection)
    await CART_MODEL.updateMany(
      {},
      { $pull: { items: { productId: req.params.id } } }
    );
  },
  ViewCategories: async (req, res) => {
    try {
      await categoryModel.find({}).then((all) => {
        console.log("got categories frm db");
        res.render("adminViews/categories", { categories: all });
      });
    } catch (error) {
      console.log(error);
    }
  },
  viewAddCategory: (req, res) => {
    res.render("adminViews/add-category");
  },
  addCategory: async (req, res) => {
    await categoryModel
      .create({ category_name: req.body.category })
      .then(() => {
        console.log("category changed");
        res.redirect("/admin/categories");
      });
  },
  viewEditCategory: async (req, res) => {
    await categoryModel.findOne({ _id: req.params.id }).then((item) => {
      console.log(item);
      res.render("adminViews/edit-category", { data: item });
    });
  },
  editCategory: async (req, res) => {
    await categoryModel
      .replaceOne({ _id: req.params.id }, { category_name: req.body.category })
      .then(() => {
        res.redirect("/admin/categories");
      });
  },
  deleteCategory: async (req, res) => {
    await categoryModel.deleteOne({ _id: req.params.id }).then(() => {
      console.log("category deleted");
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
        res.redirect("admin/login");
      }
    });
  },
  viewOrders: (req, res) => {
    ORDER_MODEL.find({})
      .populate("userId")
      .populate("items.productId")
      .then((orders) => {
        res.render("adminViews/orders", { orders });
      });
  },
  viewChangeStatus: (req, res) => {
    res.render("adminViews/change-status", { orderId: req.params.id });
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
      res.redirect("/admin/orders");
    });
  }
};
