import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

    // Configuration
    cloudinary.config({ 
      cloud_name: process.env.CLOUD_NAME, 
      api_key: process.env.API_KEY, 
      api_secret: process.env.API_SECRET // Click 'View API Keys' above to copy your API secret
  });
  

  const uploadOnCloudinary = async (localFilePath) =>{
    try {
      if(!localFilePath) return null;
      // upload on cloudinary
      const uploadResult = await cloudinary.uploader
       .upload(
           localFilePath, {
               resource_type: 'auto',
           }
       )
       console.log("File uploaded successfully on", uploadResult.url);
       fs.unlinkSync(localFilePath)
      return uploadResult;
    } catch (error) {
      fs.unlinkSync(localFilePath) // remove temporary stored file
      return null;
    }
  }


  export {uploadOnCloudinary}