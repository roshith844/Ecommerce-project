module.exports = {
    goToAdminHome: (req, res) => {
        res.render('adminViews/adminHome', { layout: false })
    },
}