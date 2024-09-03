const express=require("express")
const cors=require("cors")
const app=express()
require("./config/db")
const authRoutes=require("./routes/authRoutes")
const dotenv=require("dotenv").config()
const PORT=process.env.PORT;
app.use(cors())
app.use(express.json())
app.use("/api/auth",authRoutes)
app.get("/",(req,res)=>{
    res.send("Hello from food app")
})
app.listen(PORT,()=>{
    console.log("Server is running")
})
