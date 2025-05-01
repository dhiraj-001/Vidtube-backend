import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandeler } from "../utils/asyncHandeler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandeler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.AccessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); // user may send the tokens through header file
    // console.log("Token received in middleware:", token)
    console.log(req.cookies)
    if (!token) {
      throw new ApiError(401, "Unauthorized request: No token provided");
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (jwtError) {
      throw new ApiError(401, "Unauthorized request: Invalid or expired token");
    }
    // console.log("decodedToken" ,decodedToken)
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(404, "Unauthorized request: User not found");
    }

    req.user = user;
    // console.log("verified")
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    throw error;
  }
});
