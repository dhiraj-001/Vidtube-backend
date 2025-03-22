import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandeler } from "../utils/asyncHandeler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandeler(async (req, res) => {
  // get user details from frontend
  // validation
  // check for duplicate user
  // check from image, avater
  // upload in cloudinary
  // create user object - create entry in db
  // remove password and refresh token from response
  // check for user creation
  // return response

  const { userName, email, fullName, password } = req.body;

  if ([userName, email, fullName, password].some((val) => val?.trim() === "")) {
    throw new ApiError("400", "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImagePath ;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagePath = req.files?.coverImage[0]?.path;
  }
 

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  
  const coverImage = await uploadOnCloudinary(coverImagePath);
  console.log(avatar)
  if (!avatar) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const user = await User.create({
    userName,
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

export { registerUser };
