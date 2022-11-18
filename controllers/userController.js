module.exports = {
    goToLogin: (req, res) => {
        res.render('login')
    },
    goTosignUp: (req, res) => {
        res.render('signup')
    },
    sendToDatabase: (req, res) => {
        const UserModel = require('../model/userSchema')
        if (req.body.password === req.body.repeatPassword) {
            const newUser = new UserModel({ name: req.body.name, email: req.body.email, password: req.body.password })
            newUser.save().then(() => {
                console.log("user added to database");
                res.redirect("/login");
            })
        } else {
            console.log("password doesn't match")
            res.redirect('/signup')
        }

    }
}


