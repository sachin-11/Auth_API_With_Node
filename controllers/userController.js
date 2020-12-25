const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const _ = require("lodash");
const multer = require('multer')
const generateToken  = require('../utils/genrateToken')
const { sendEmail }  = require('../utils/mailer')



// Check File Type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);
  
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  }


  const storage = multer.diskStorage({
    //multers disk storage settings
    destination: (req, file, cb) => {
      cb(null, "./public/images/");
    },
    filename: (req, file, cb) => {
      const ext = file.mimetype.split("/")[1];
  
      cb(null, uuidv4() + "." + ext);
    },
  });


  const upload = multer({
    //multer settings
    storage: storage,
    fileFilter: function (req, file, cb) {
      checkFileType(file, cb);
    },
    limits: {
      fileSize: 1024 * 1024,
    },
  }).single("photo");
  
  exports.upload = (req, res, next) => {
    upload(req, res, (err) => {
      if (err) return res.json({ message: err.message });
  
      if (!req.file) return res.json({ message: "Please upload a file" });
  
      req.body.photo = req.file.filename;
  
      Jimp.read(req.file.path, function (err, test) {
        if (err) throw err;
        test
          .resize(100, 100)
          .quality(50)
          .write("./public/images/100x100/" + req.body.photo);
        next();
      });
    });
  };
  


const signup = async (req, res) => {
    const { name, email, address, info, password, phone, photo,  resetPasswordLink, resetEmailLink} = req.body
    const userExists = await User.findOne({ email })
    if(userExists){
        return res.status(400).json({ msg: 'User is already exists'})
    }

    const user = await User.create({
        name,
        address,
        email,
        info,
        password,
        phone,
        photo,
        resetEmailLink,
        resetPasswordLink
    })

    if(user){
        const token = jwt.sign(
            { _id: user._id, iss: "NODEAPI" },
            process.env.JWT_SECRET
          );
    // email data
      const emailData = {
       from: "noreply@ebizzdevelopment.com",
      to: email,
       subject: "Password Reset Instructions",
       text: `Please use the following link to reset your password: ${process.env.CLIENT_URL}/reset-password/${token}`,
      html: `<p>Please use the following link to reset your password:</p> <p>${process.env.CLIENT_URL}/reset-password/${token}</p>`
     };

     return user.updateOne({ resetEmailLink: token}, (error, success) => {
        if(error){
            return res.json({ error: error})
        } else {
           sendEmail(emailData)
           return res.status(200).json({
              message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
            });

        }    
        
      })   
    
      
    }
   
}


const signIn = async(req, res) => {
    const { email, password} = req.body;
    const user = await User.findOne({ email })

    if(user && (await user.matchPassword(password))){
        res.json({ 
            _id: user._id,
            name: user.name,
            email: user.email,
            info: user.info,
            photo: user.photo,
            phone: user.phone,
            token:generateToken(user._id) 
        })
     } else {
         res.status(401).json({ 
             msg: 'invalid email and password'
         })
     }
}



const forgotPassword = async (req, res) => {
    if(!req.body){
        return res.json({ msg: 'no request body'})
    }
    if(!req.body.email){
        return res.json({msg: 'email is required'})
    }

    const { email } = req.body;

    const user = await User.findOne({ email })

    if(!user){
        return res.json({ msg: 'User not found with that email'})
    }

    const token = jwt.sign(
        { _id: user._id, iss: "NODEAPI" },
        process.env.JWT_SECRET
      );

     // email data
  const emailData = {
    from: "noreply@ebizzdevelopment.com",
    to: email,
    subject: "Password Reset Instructions",
    text: `Please use the following link to reset your password: ${process.env.CLIENT_URL}/reset-password/${token}`,
    html: `<p>Please use the following link to reset your password:</p> <p>${process.env.CLIENT_URL}/reset-password/${token}</p>`
  };

  return user.updateOne({ resetPasswordLink: token}, (error, success) => {
      if(error){
          return res.json({ error: error})
      } else {
         sendEmail(emailData)
         return res.status(200).json({
            message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
          });
      }
  })

}


const resetPassword = async (req, res) => {
    const {resetPasswordLink, newPassword} = req.body

    let user = await User.findOne({ resetPasswordLink  })

    // if err or no user
  if (!user)
  return res.status(401).json({
    error: "Invalid Link!"
  });


  const updatedFields = {
      password: newPassword,
      resetPasswordLink:  ''
      
  }

  user = _.extend(user, updatedFields);
  user.updated = Date.now();

  user.save((err, result) => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    }
    res.json({
      message: `Great! Now you can login with your new password.`
    });
  });

}





module.exports = {
    signup,
    signIn,
    forgotPassword,
    resetPassword
}