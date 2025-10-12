import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary,deleteFromCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'

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
export {
    registerUser
}