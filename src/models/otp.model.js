import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // OTP will be automatically deleted after 5 minutes
    },
  },
  {
    timestamps: true,
  }
);

export const OTP = mongoose.model("OTP", otpSchema); 