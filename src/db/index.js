import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
try {
  await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
  console.log(`Connected to ${DB_NAME} DB`);
  
} catch (error) {
  console.log("Mongodb connection error: " + error);
  process.exit(1);
}
}

export default connectDB