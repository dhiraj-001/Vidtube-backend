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

router.use(verifyJWT); // Apply verifyJWT to all the routes

router.route("/publishvideo").post(
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

router.route("/videos/delete/:videoId").delete(deleteVideo);
router.route("/videos/change-status/:videoId").post(togglePublishStatus);
router.route("/videos/get-video/:videoId").get(getVideoById);
router.route("/videos").get(getAllVideos);
export default router;
