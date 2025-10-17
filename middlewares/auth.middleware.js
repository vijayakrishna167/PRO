import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"


export const verifyJWT = asyncHandler(async (req,res,next)=>{
    const token = req.cookies.accessToken || req.header("Authorization").replace("Bearer ","")
    if(! token){
        throw new ApiError(401,"unauthorized")
    }
    try {
        const decoded_token=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decoded_token._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(401,"unauthorized")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid access token")
    }
})