const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
     destination: (req, file,callback)=>{
          callback(null, './public/images')
     },
     filename: (req, file, callback)=>{
          console.log(file)
          callback(null, Date.now()+ path.extname(file.originalname))
     }
})

// upload.single("image")
// puton data enctype="multipart/form=data"   
// tyoe file name image
const upload = multer({storage: storage})
module.exports= upload
