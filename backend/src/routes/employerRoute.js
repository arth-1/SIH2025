import express from "express";
import jwt from "jsonwebtoken";
import { JWT_EMPLOYER_SECRET } from "../config/config.js";
import EmployerModel from "../models/employerModel.js";

const employerRoute = express.Router();

employerRoute.post("/signup", async (req, res) => {
  try {
    console.log("RAW REQ BODY:", req.body);
    console.log("HEADERS:", req.headers["content-type"]);

    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await EmployerModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    await EmployerModel.create({
      email,
      password,
      firstName,
      lastName,
    });

    return res.json({ message: "Signup successful" });
  } catch (e) {
    console.log("Error during signup:", e);
    return res.status(500).json({
      message: "Internal server error",
      error: e.message,
    });
  }
});

employerRoute.post("/signin", async (req, res) => {
  try {
    console.log("RAW REQ BODY:", req.body);
    console.log("HEADERS:", req.headers["content-type"]);

    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await EmployerModel.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, JWT_EMPLOYER_SECRET, {
        expiresIn: "1h",
      });
      return res.json({ message: "Signin successful", token });
    } else {
      return res.status(403).json({ message: "Incorrect credentials" });
    }
  } catch (e) {
    console.log("Error logging in:", e);
    return res.status(500).json({
      message: "Internal server error",
      error: e.message,
    });
  }
});

export default employerRoute;
