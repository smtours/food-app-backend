const dotenv=require("dotenv").config()
const secretkey=process.env.JWT_SECRET;
const  jwt  = require('jsonwebtoken');
const fetchUser=async(req,res,next)=>{
    const token=req.header('Authorization');
    if(!token){
      return res.status(401).send('Unauthorized user')
    }
    try {
      const data=jwt.verify(token,secretkey);
      console.log(data)
      req.user=data;
      next();
    } catch (error) {
      res.status(401).send('Internal eroor')
    }

}




module.exports=fetchUser;