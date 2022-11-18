const session = require("express-session");
const cookieParser = require("cookie-parser");
const UserModel = require('../model/userSchema')
module.exports = {

    // Renders Login Page
    goToLogin: (req, res) => {
        res.render('login')
    },
    // Renders Signup page
    goTosignUp: (req, res) => {
        res.render('signup', { msg: '' })
    },
    // Sends user data to database for Registration
    sendToDatabase: (req, res) => {
        // Validates User input
        if (req.body.password === req.body.repeatPassword) {

            // Checks with regex patterns
            const emailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/  // Pattern for Minimum eight characters, at least one letter, one number and one special character
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
            res.render('signup', { msg: "password doesn't match. Try Again" })
        }
    },
    doLogin: async (req, res) => {
        const userDoc = await UserModel.findOne({ email: req.body.email });
        if (
            userDoc.password == req.body.password
        ) {
            req.session.user = req.body.email;
            res.redirect("/");
        } else {
            res.render("login");
        }
    },
    goHome: (req, res)=>{
        if (req.session.user) {
            res.render('home');
          } else {
            res.redirect('/login');
          }
    },
    doLogout: (req, res)=>{
          // Destroys session
  req.session.destroy((error) => {
    if (error) {
      console.log(error);
    } else {
      console.log("logout successfully");
      res.redirect("/login");
    }
  });
    }
}


