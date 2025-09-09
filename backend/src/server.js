import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import employerRouter from "./routes/employerRoute.js";
import instituteRouter from "./routes/instituteRouter.js";
import certificateRouter from "./routes/certificateRoute.js"; 

dotenv.config();
const app = express();

app.use(express.json());

connectDB();

app.use("/api/v1/employer", employerRouter);
app.use("/api/v1/institute", instituteRouter);
app.use("/api/v1/certificate", certificateRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));