import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import Certificate from "../models/certificateModel.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Single certificate upload
router.post("/upload", async (req, res) => {
  try {
    const { image } = req.body;
    const cert = new Certificate({ image });
    await cert.save();
    res.json({ message: "Certificate uploaded successfully." });
  } catch (err) {
    res.status(500).json({ error: "Upload failed." });
  }
});

// Bulk certificate upload
router.post("/upload/bulk", async (req, res) => {
  try {
    const { certificates } = req.body; // Array of { image }
    if (!Array.isArray(certificates)) {
      return res.status(400).json({ error: "certificates must be an array." });
    }
    await Certificate.insertMany(certificates.map(img => ({ image: img.image })));
    res.json({ message: "Bulk certificates uploaded successfully." });
  } catch (err) {
    res.status(500).json({ error: "Bulk upload failed." });
  }
});

// Excel upload
router.post("/upload/excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }
    const filePath = path.resolve(req.file.path);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Each row should have an 'image' field
    const certificates = data.map(row => ({
      image: row.image,
      uploadedAt: new Date()
    }));

    await Certificate.insertMany(certificates);

    fs.unlinkSync(filePath); // Clean up

    res.json({ message: "Excel file processed and certificates uploaded." });
  } catch (err) {
    res.status(500).json({ error: "Excel upload failed." });
  }
});

export default router;