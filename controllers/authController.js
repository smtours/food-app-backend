const User=require("../models/userModel")
const twilio =require("twilio")
const dotenv=require("dotenv").config()
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const bcrypt=require("bcrypt")
const saltRounds = 10;
const jwt=require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET;

const registeruser=async(req,res)=>{
  const { username, password, confirmpassword, phoneNumber } = req.body;
  try {
   
    let user = await User.findOne({ phoneNumber });

    if (user && user.isVerified) {
        return res.status(400).json({ message: 'Phone number already registered and verified' });
    }

  
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

  
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    if(password!==confirmpassword){
        return res.status(401).json({message:"Password and confirm password should be same"})
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    if (user && !user.isVerified) {
      
        user.otp = otp;
        user.otpExpires = otpExpires;
        user.password = hashedPassword;
    } else {
       
        user = new User({ username, password:hashedPassword, email, phoneNumber, otp, otpExpires });
    }

   
    await user.save();
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '10m' });
    user.jwtToken = token;
        await user.save();

   
    await client.messages.create({
        body: `Your OTP is ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
    });

    res.status(200).json({ message: 'OTP sent to your phone number. Please verify.',token,user });
} catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
}
}

const resendOtp = async (req, res) => {
    try {
   
        const { phoneNumber } = req.params;

       
        const user = await User.findOne({ phoneNumber, isVerified: false });
        if (!user) return res.status(400).json({ message: 'Invalid request or user already verified' });

        
        const token = user.jwtToken;

        if (!token) return res.status(400).json({ message: 'No JWT token found for this user' });

        
        const newOtp = Math.floor(1000 + Math.random() * 9000).toString();

       
        const newOtpExpires = new Date(Date.now() + 5 * 60 * 1000);

      
        user.otp = newOtp;
        user.otpExpires = newOtpExpires;
        await user.save();

        // Send new OTP to user's phone number
        await client.messages.create({
            body: `Your new OTP is ${newOtp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        res.status(200).json({ message: 'New OTP sent to your phone number' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


const verifyOtp = async (req, res) => {
  const { otp } = req.body;

  try {
     
      const user = await User.findOne({ otp, otpExpires: { $gt: Date.now() }, isVerified: false });

      if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

     
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      res.status(200).json({ message: 'User verified successfully' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
  }
};
const login = async (req, res) => {
  const { username, password } = req.body;
  try {
      
      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ message: 'User not found' });

    
      if (!user.isVerified) {
          return res.status(400).json({ message: 'User is not verified. Please verify your OTP first.' });
      }

      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

      
      const token = jwt.sign({ userId: user._id }, JWT_SECRET);
      res.status(200).json({ message: 'Login successful', token});
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
  }
};

const requestPasswordReset = async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        const user = await User.findOne({ phoneNumber });

        if (!user) return res.status(404).json({ message: 'User not found' });

     
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

     
        user.resetOtp = otp;
        user.resetOtpExpires = otpExpires;
        await user.save();

     
        await client.messages.create({
            body: `Your password reset OTP is ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        res.status(200).json({ message: 'OTP sent to your phone number. Please verify.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
const verifyforgetpasswordotp = async (req, res) => {
    const { otp } = req.body;

    try {
        const user = await User.findOne({ resetOtp: otp, resetOtpExpires: { $gt: Date.now() } });

        if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

       
        user.resetOtp = null;
        user.resetOtpExpires = null;
        await user.save();

       
        const token = jwt.sign({ phoneNumber: user.phoneNumber }, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.status(200).json({ message: 'OTP verified. Use the token to reset your password.', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params; 
    const { newPassword, confirmPassword } = req.body;

    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const phoneNumber = decoded.phoneNumber;

        // Find user by phone number
        const user = await User.findOne({ phoneNumber });

        if (!user) return res.status(404).json({ message: 'User not found' });

    
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        
        const hashedPassword = await bcrypt.hash(newPassword, 10);

      
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const token = req.headers['Authorization']; 

    if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
    }

    try {
     
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id; 

       
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirm password do not match' });
        }

     
        const hashedPassword = await bcrypt.hash(newPassword, 10);

       
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password has been changed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


const updateprofile=async(req,res)=>{
    const {id}=req.params;
    const {username,email,city}=req.body;
    try {
        const user=await User.findById(id)
        if(!user){
            return res.status(401).json({message:"User Not Found"})
        }
        const data=await User.findByIdAndUpdate(id,{
            username,email,city
        },{newLtrue})
        res.status(201).json(data)
    } catch (error) {
         return res.status(401).json({message:error.message})
    }
}

module.exports={registeruser,verifyOtp,login,resendOtp,requestPasswordReset,resetPassword,verifyforgetpasswordotp
,changePassword,updateprofile
}

