import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload on cloudinary
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File uploaded successfully on", uploadResult.url);
    fs.unlinkSync(localFilePath);
    console.log(uploadResult);
    return uploadResult;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove temporary stored file
    return null;
  }
};

const deletefromCloudinary = async (imageUrl) => {
  const publicId = imageUrl.split("/").pop().split(".")[0]; // Extracts 'sample';
  try {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
          return res.status(500).json({ error: 'Failed to delete image', details: error });
      }
      res.status(200).json({ message: 'Image deleted successfully', result });
  });

  } catch (error) {
    console.log("Delete error" ,error);
   
  }
};

export { uploadOnCloudinary,deletefromCloudinary };
