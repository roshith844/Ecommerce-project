const adminModel = require('../model/adminSchema')
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
                console.log("Pasword checked")
                req.session.admin = req.body.email;
                res.redirect("/admin");
            } else {
                res.render('adminViews/adminLogin', { layout: 'layouts/adminLayout' })
            }

        } catch (error) {
            res.status(400).render('adminViews/adminLogin', { layout: 'layouts/adminLayout' })
        }
    }
}