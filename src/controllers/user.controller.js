import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandeler } from "../utils/asyncHandeler.js";
import {
  uploadOnCloudinary,
  deletefromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error while generating access and refresh tokens");
  }
};
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
  let coverImagePath;
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
  console.log(avatar);
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

const loginUser = asyncHandeler(async (req, res) => {
  // req -> body
  // username, email
  // find user
  // password check
  // access and refresh token generate
  // send cookies

  const { userName, email, password } = req.body;
  console.log(req.body);

  if (!(userName || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  }); // it provide every details . some unwanted fields

  if (!user) {
    throw new ApiError(400, "User doesnot exixt");
  }

  const passwordValid = await user.isPasswordCorrect(password);

  if (!passwordValid) {
    throw new ApiError(401, "Ivaild Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessefreshToken(
    user._id
  );

  // we dont have to send password and refreshtokes
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true, //cookies cannot be modified from frontend
    secure: true,
  };

  return res
    .status(200)
    .cookie("AccessToken", accessToken, options)
    .cookie("RefreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken, // when user try to save access and refesh token manually
        },
        "User loggin in successfully"
      )
    );
});

const logOutUser = asyncHandeler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true, //cookies cannot be modified from frontend
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("AccessToken", options)
    .clearCookie("RefreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandeler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }
  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(403, "Invalid refresh token");
    }

    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(403, "Refresh token expired");
    }

    const options = {
      httpOnly: true, //cookies cannot be modified from frontend
      secure: true,
    };

    const { accessToken, newrefreshToken } = await generateAccessefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("AccessToken", accessToken, options)
      .cookie("RefreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newrefreshToken,
          },
          "User refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message);
  }
});

const changeCurrentPassword = asyncHandeler(async (req, res) => {
  // check if user is authenticated
  // get current password from req.body
  // get new password from req.body
  // check if current password is correct
  // update password
  // return updated user

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const passwordValid = await user.isPasswordCorrect(currentPassword);
  if (!passwordValid) {
    throw new ApiError(401, "Invalid current password");
  }

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Password changed successfully"));
});

const getCurrentUser = asyncHandeler(async (req, res) => {
  return res.status(200).json(200, req.user, "User retrieved successfully");
});

const updateCurrentUser = asyncHandeler(async (req, res) => {
  // check if user is authenticated
  // get updated details from req.body
  // update user

  const { userName, email, fullName } = req.body;
  if (!userName || !email || !fullName) {
    throw new ApiError(400, "All fields are required");
  }

  const user = User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        userName,
        email,
        fullName,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

const updateAvatar = asyncHandeler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const oldAvatarUrl = req.user?.avatar;
  await deletefromCloudinary(oldAvatarUrl);
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Failed to upload avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandeler(async (req, res) => {
  const coverImagePath = req.file?.path;

  if (!coverImagePath) {
    throw new ApiError(400, "Cover Image file is missing");
  }

  const coverImg = await uploadOnCloudinary(avatarLocalPath);

  if (!coverImg) {
    throw new ApiError(400, "Failed to upload cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: coverImg.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfullty"));
});

const getUserChannelProfile = asyncHandeler(async (req, res) => {
  const { userName } = req.params;
  if (!userName?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.tolowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriberedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        subscriberedToCount: { $size: "$subscriberedTo" },
      },
    },
  ]);
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateCurrentUser,
  updateAvatar,
  updateCoverImage,
};
