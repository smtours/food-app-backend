// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
    jwtToken: { type: String },
    resetOtp: { type: String }, // Field for password reset OTP
    resetOtpExpires: { type: Date },
    city:{
      type:String,
    }
});

const User = mongoose.model('users', userSchema);
module.exports=User;
