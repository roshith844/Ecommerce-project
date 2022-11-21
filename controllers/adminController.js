const adminModel = require('../model/adminSchema')
const UserModel = require("../model/userSchema");
const session = require("express-session");
const cookieParser = require("cookie-parser");

module.exports = {
    goToAdminHome: (req, res) => {
        if (req.session.admin) {
            res.render('adminViews/adminHome', { layout: false })
        } else {
            res.redirect('/admin/login')
        }
    },
    goToAdminLogin: (req, res) => {
        res.render('adminViews/adminLogin', { layout: 'layouts/adminLayout' })
    },
    doAdminLogin: async (req, res) => {
        try {
            const adminDoc = await adminModel.findOne({ email: req.body.email })
            if (adminDoc.password == req.body.password) {
                console.log(adminDoc.password)
                console.log("Password checked")
                req.session.admin = req.body.email;
                res.redirect("/admin");
            } else {
                res.render('adminViews/adminLogin', { layout: 'layouts/adminLayout' })
            }

        } catch (error) {
            res.status(400).render('adminViews/adminLogin', { layout: 'layouts/adminLayout' })
        }
    },
    listUsers: async (req, res) => {
        try {
            await UserModel.find({}).then((users) => {
                if (req.session.blockInfo == true) {
                    res.render('adminViews/users', { users: users, msg: "blocked succusfully", unblockmsg: "" })
                    req.session.blockInfo = false;
                } else if (req.session.blockInfo == false) {
                    res.render('adminViews/users', { users: users, msg: "", unblockmsg: "" })
                } else if (req.session.unblockInfo == true) {
                    res.render('adminViews/users', { users: users, unblockmsg: "Unblocked succusfully", msg: "" })
                    req.session.unblockInfo = false;
                } else {
                    res.render('adminViews/users', { users: users, unblockmsg: "", msg: "" })
                }


            })
        } catch (error) {
            console.log(error)
        }
    },
    blockUser: async (req, res) => {
        console.log(req.params.id)
        const updated = await UserModel.findOneAndUpdate({ _id: req.params.id }, { $set: { blockStatus: true } }).then(() => {
            console.log('updated')
            req.session.blockInfo = true;
        })

        res.redirect('/admin/users')
    },
    unblockUser: async (req, res) => {
        await UserModel.findOneAndUpdate({ _id: req.params.id }, { $set: { blockStatus: false } }).then(() => {
            console.log('updated block status to false')
            req.session.unblockInfo = true;
        })
        res.redirect('/admin/users')
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
        })
    }
}