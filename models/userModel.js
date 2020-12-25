const mongoose = require("mongoose");
const bcrypt = require('bcryptjs')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        maxlength: 32
    },
    address: {
        type: String,
        trim: true,
        required: true,
        maxlength: 32
    },
    email: {
        type: String,
        trim: true
    },
    info: {
        type: String,
        trim: true,
        maxlength: 32
    },
    phone: {
        type: Number,
        max : 9999999999,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    photo: {
        type: String
    },
    resetPasswordLink: {
        type: String,
        default: ""
    },
    resetEmailLink: {
        type: String,
        default: ""
    },
    salt: String,
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

userSchema.methods.matchPassword = async function(enterPassword) {
    return   await bcrypt.compare(enterPassword, this.password)
 }
 
 userSchema.pre('save', async function (next) {
   if (!this.isModified('password')) {
     next()
   }
 
   const salt = await bcrypt.genSalt(10)
   this.password = await bcrypt.hash(this.password, salt)
 })
 


module.exports = mongoose.model("User", userSchema);