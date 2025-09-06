import dotenv from "dotenv";
dotenv.config();
export const JWT_EMPLOYER_SECRET = process.env.JWT_EMPLOYER_SECRET;
export const JWT_INSTITUTE_SECRET = process.env.JWT_INSTITUTE_SECRET;
export const MONGO_URI = process.env.MONGO_URI;
export const PORT = process.env.PORT || 5000;