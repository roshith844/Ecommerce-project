module.exports = {
    goToLogin: (req, res) => {
        res.render('login')
    },
    goTosignUp: (req, res) => {
        res.render('signup', { msg: '' })
    },
    sendToDatabase: (req, res) => {
        const UserModel = require('../model/userSchema')
        // Validates User input
        if (req.body.password === req.body.repeatPassword) {
            // matches with regex pattern
            const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
            console.log(emailRegex.test(req.body.email))
            console.log(passwordRegex.test(req.body.password))
            if ((emailRegex.test(req.body.email)) && (passwordRegex.test(req.body.password))) {
                const newUser = new UserModel({ name: req.body.name, email: req.body.email, password: req.body.password })
                newUser.save().then(() => {
                    console.log("user added to database");
                    res.redirect("/");
                })
            } else {
                res.render('signup', { msg: "Invalid credentials!! 1. Email should be in proper form  2. password should be Minimum eight characters, at least one letter, one number and one special character 3. Password should match" })
            }
        } else {
            console.log("password doesn't match")
            res.render('signup', { msg: '' })
        }

    }
}


