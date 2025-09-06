import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import employerRouter from "./routes/employerRoute.js";
import instituteRouter from "./routes/instituteRouter.js";

dotenv.config();
const app = express();

// This is REQUIRED for JSON parsing
app.use(express.json());

connectDB();

app.use("/api/v1/employer", employerRouter);
app.use("/api/v1/institute", instituteRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
