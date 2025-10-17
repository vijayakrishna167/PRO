import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary,deleteFromCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

const geneerateAccessAndRefreshToken = async(userId)=>{
   try {
    const user= await User.findById(userId)
    if(!user){
     throw new ApiError(400,"couldn't find the user")
    }
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
 
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave:false})
    return {accessToken,refreshToken}
   } catch (error) {
    throw new ApiError(500,"something went wrong while generating tokens")
   }
}

const registerUser = asyncHandler(async(req,res)=>{
    //todo
    const{fullname,email, username, password} =req.body
    //validation
    //fullName?.trim() === ""
    if([fullname,email,username,password].some((field)=>field?.trim()=="")){
        throw new ApiError(400,"All fields are required")
    }
    const existedUser = await User.findOne({
        $or: [{email},{username}]
    })
    if(existedUser){
        throw new ApiError(409,"user already existed")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverLocalPath = req.files?.coverImage?.[0]?.path

    if(! avatarLocalPath){
        throw new ApiError(400,'avatar file is missing')
    }

    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // let coverImage = ""
    // if(coverLocalPath){
    //     coverImage = await uploadOnCloudinary(coverLocalPath)
    // }
    let avatar;
    try {
        avatar=await uploadOnCloudinary(avatarLocalPath)
    } catch (error) {
        throw new ApiError(500,'failed to upload avatar')
    }
    let coverImage;
    try {
        coverImage=await uploadOnCloudinary(coverLocalPath)
    } catch (error) {
        throw new ApiError(500,'failed to upload cover')
    }

    try {
        const user = await User.create({
            fullname,
            avatar : avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })
        const createduser = await User.findById(user._id).select("-password -refreshToken")
    
        if(! createduser){
            throw new ApiError(500,"something went wrong while registering a user")
        }
        return res.status(201).json(new ApiResponse(201,createduser, "user registered successfully"))
    } catch (error) {
        console.log("user creation failed")
        if(avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }
        throw new ApiError(500,"something went wrong while registering a user images are deleted")
    }

})

const loginUser = asyncHandler(async (req,res)=>{
    //get data from body
    const {username, email, password}= req.body

    //validation
    if(!email){
        throw new ApiError(400,"email name is required")
    }
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(404,"user not found")
    }

    //validate password
    const passwordValid = await user.isPasswordCorrect(password)

    if(!passwordValid){
        throw new ApiError(401, "invalid credentials")
    }

    const {accessToken, refreshToken} = await geneerateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")
    if(!loggedInUser){
        throw new ApiError(400,"login failed")
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,
        {user : loggedInUser, accessToken, refreshToken},
        "userLoggedin Successfully"))
})

const logoutUser = asyncHandler(async(req,res)=>{
    await user.findByIdAndUpdate(
        req.user._id,
    {
        $set:{
            refreshToken:undefined,
        },
    },{new: true}
    )
    const options ={
        httpOnly: true,
        secure : process.env.NODE_ENV === "production"
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user loggedout successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"refresh token is required")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"invalid refresh token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "invalid refresh token")
        }
        const options = {
            httpOnly : true,
            secure : process.env.NODE_ENV === "production"
        }
        const {accessToken,refreshToken: newRefreshToken}=await geneerateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("access token",accessToken,options)
        .cookie("refresh token",newRefreshToken,options)
        .json(new ApiResponse(200,
            {accessToken,refreshToken:newRefreshToken},
            "access token refreshed successfully"
        ))
    } catch (error) {
        throw new ApiError(500, "something went wrong while refreshing access token")
    }
})
export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser
}