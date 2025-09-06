import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
  image: String, // base64 or URL
  uploadedAt: { type: Date, default: Date.now }
});

const Certificate = mongoose.model("Certificate", certificateSchema);
export default Certificate;