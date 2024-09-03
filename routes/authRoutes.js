const express=require("express")
const router=express.Router()
const {registeruser,verifyOtp,login,resendOtp,requestPasswordReset,verifyforgetpasswordotp,resetPassword,
    changePassword,updateprofile
}=require("../controllers/authController")
const fetchUser = require("../middlewares/fetchUser")
router.post("/register",registeruser)
router.post("/verifyotp",verifyOtp)
router.post("/login",login)
router.get("/resendotp/:phoneNumber",resendOtp)
router.post("/forgetpassword",requestPasswordReset)
router.post("/verifypasswordotp",verifyforgetpasswordotp)
router.post("/resetpassword/:token",resetPassword)
router.post("/changepassword",fetchUser,changePassword)
router.patch("/updateprofile/:id",fetchUser,updateprofile)










module.exports=router;