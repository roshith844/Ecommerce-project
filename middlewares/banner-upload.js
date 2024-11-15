const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
     destination: (req, file,callback)=>{
          callback(null, './public/images/banners')
     },
     filename: (req, file, callback)=>{
          callback(null, Date.now()+ path.extname(file.originalname))
     }
})

// upload.single("image")
// puton data enctype="multipart/form-data"   
// tyoe file name image
const uploadBanner = multer({storage: storage})
module.exports= uploadBanner