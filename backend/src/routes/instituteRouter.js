import express from "express";
import jwt from "jsonwebtoken";
import { JWT_INSTITUTE_SECRET } from "../config/config.js";
import InstituteModel from "../models/instituteModel.js";

const instituteRouter = express.Router();

instituteRouter.post("/signup", async (req, res) => {
  try {
    const { instituteName, email, password } = req.body;

    if (!instituteName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingInstitute = await InstituteModel.findOne({ email });
    if (existingInstitute) {
      return res.status(409).json({ message: "Email already registered" });
    }

    await InstituteModel.create({
      instituteName,
      email,
      password,
    });

    return res.json({ message: "Signup successful" });
  } catch (e) {
    console.log("error during signup", e);
    return res.status(500).json({
      message: "Internal server error",
      error: e.message,
    });
  }
});

instituteRouter.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await InstituteModel.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, JWT_INSTITUTE_SECRET, {
        expiresIn: "1h",
      });
      return res.json({ message: "Signin successful", token });
    } else {
      return res.status(403).json({
        message: "Incorrect credentials",
      });
    }
  } catch (e) {
    console.log("error loginin", e);
    return res.status(500).json({
      message: "Internal server error",
      error: e.message,
    });
  }
});

export default instituteRouter;
