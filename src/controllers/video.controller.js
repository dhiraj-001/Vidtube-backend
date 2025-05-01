import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/videos.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandeler } from "../utils/asyncHandeler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deletefromCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandeler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

  const filter = {};
  if (userId) {
    filter.owner = userId;
  }
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  const sort = {};
  sort[sortBy] = sortType === "asc" ? 1 : -1;

  const aggregate = Video.aggregate().match(filter).sort(sort);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const result = await Video.aggregatePaginate(aggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});

const publishAVideo = asyncHandeler(async (req, res) => {
  // console.log(req)
  const { title, description, isPublished } = req.body;
  const videoFilePath = req.files?.videosFile[0]?.path;
  const thumbnailFilePath = req.files?.thumbnail[0]?.path;

  if (!videoFilePath || !thumbnailFilePath) {
    throw new ApiError(400, "Video file or thumbnail file is missing!!");
  }
  if (!title || !description) {
    throw new ApiError(500, "Title and description are required!!");
  }
  console.log(title);
  const videoFile = await uploadOnCloudinary(videoFilePath);
  const thumbnailFile = await uploadOnCloudinary(thumbnailFilePath);

  if (!videoFile || !thumbnailFile) {
    throw new ApiError(500, "failed to upload on cloudinary");
  }

  const newVideo = Video.create({
    title,
    description,
    videosFile: videoFile.url,
    thumbnail: thumbnailFile.url,
    duration: 0,
    isPublished: isPublished || true,
    owner: req.userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(201, newVideo, "Video published successfully"));
});

const getVideoById = asyncHandeler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Invalid video id");
  }

  const newVid = await Video.findById(videoId);
  if (!newVid) {
    throw new ApiError(404, "Video not found");
  }
  // console.log(newVid);
  return res
    .status(200)
    .json(new ApiResponse(200, newVid, "Video fetched successfully"));
});

const updateVideo = asyncHandeler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(404, "Video not found!");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  const { title, description } = req.body;

  if (title) video.title = title;
  if (description) video.description = description;

  // Handle file uploads if present
  if (req.files) {
    if (req.files.videosFile && req.files.videosFile.length > 0) {
      const oldVideourl = req.Video.url;
      console.log(oldVideourl);
      const videoFilePath = req.files.videosFile[0].path;
      const uploadedVideo = await uploadOnCloudinary(videoFilePath);
      if (!uploadedVideo) {
        throw new ApiError(500, "Failed to upload video file");
      }
      video.videosFile = uploadedVideo.url;
    }
    if (req.files.thumbnail && req.files.thumbnail.length > 0) {
      const thumbnailFilePath = req.files.thumbnail[0].path;
      const uploadedThumbnail = await uploadOnCloudinary(thumbnailFilePath);
      if (!uploadedThumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail file");
      }
      video.thumbnail = uploadedThumbnail.url;
    }
  }

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandeler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Delete video file from Cloudinary
  if (video.videosFile) {
    await deletefromCloudinary(video.videosFile);
  }

  // Delete thumbnail from Cloudinary
  if (video.thumbnail) {
    await deletefromCloudinary(video.thumbnail);
  }

  await video.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandeler(async (req, res) => {
  const { videoId } = req.params;
  const { isPublished } = req.body;
  if (!videoId) {
    throw new ApiError(400, "Invlid video id");
  }
  if (isPublished === undefined) {
    throw new ApiError(401, "no input from user");
  }

  const newvid = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, newvid, "Status updated successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
