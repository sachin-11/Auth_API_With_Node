const express = require('express')
const router = express.Router();
const { signup, signIn, forgotPassword, resetPassword } = require('../controllers/userController')



router.route('/register').post(signup)
router.route('/login').post(signIn)
router.route('/forgot-password').put(forgotPassword)
router.route('/reset-password').put(resetPassword)






module.exports = router;