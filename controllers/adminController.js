module.exports={
    goToAdminHome: (req, res) => {
        res.render('adminHome', { layout: false })
    },
}