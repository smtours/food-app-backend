const mongoose=require("mongoose")
const dotenv=require("dotenv").config()
const URI=process.env.MONGOURI;
mongoose.connect(URI).then(()=>{
    console.log("Connected to db")
}).catch((e)=>{
    console.log(e)
})
