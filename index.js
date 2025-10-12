import { app } from "./app.js";
import dotenv from 'dotenv'
import connectDB from "./db/index.js";
dotenv.config()

connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
    console.log(`server is running on ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("mongodb connection error",err)
})