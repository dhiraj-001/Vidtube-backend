import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandeler } from "../utils/asyncHandeler.js";
import jwt from "jsonwebtoken"


export const verifyJWT = asyncHandeler(
  async (req, _, next) => {
    try {
      const token = req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ","") // user may send the tokens through header file
  
      if(!token){
        throw new ApiError(401, "Unauthorized request ")
      }
  
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  
      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      )
  
      if(!user){
        throw new ApiError(404, "invalid access token")
      }
  
      req.user = user
      next()
    } catch (error) {
      throw new ApiError(401, "Unauthorized request ")
    }
  }
)