import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import {
  deleteVideo,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  getAllVideos,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/publishvideo").post(
  verifyJWT,
  upload.fields([
    {
      name: "videosFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

router.route("/videos/:videoId").put(
  verifyJWT,
  upload.fields([
    {
      name: "videosFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  updateVideo
);

router.route("/videos/delete/:videoId").delete(verifyJWT, deleteVideo);
router.route("/videos/change-status/:videoId").post(verifyJWT, togglePublishStatus);
router.route("/videos/get-video/:videoId").get( getVideoById);
router.route("/videos").get(getAllVideos);
export default router;
