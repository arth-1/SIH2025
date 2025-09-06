import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongo connected!!!!!!!!!!!");
  } catch (err) {
    console.error("Error connecting the database:", err.message);
    process.exit(1);
  }
}

export default connectDB;
