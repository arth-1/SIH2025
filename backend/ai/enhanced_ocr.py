#!/usr/bin/env python3
"""
Enhanced OCR Service for Certificate Processing
Supports both image and PDF files, with AI-powered data extraction
"""

import os
import sys
import json
import argparse
from pathlib import Path
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import google.generativeai as genai
from datetime import datetime
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration from environment variables
TESSERACT_PATH = os.getenv('TESSERACT_PATH', r"C:/Program Files/Tesseract-OCR/tesseract.exe")
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables!")
    sys.exit(1)

# Set Tesseract path
pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

class CertificateOCR:
    def __init__(self):
        self.supported_formats = ['.png', '.jpg', '.jpeg', '.heic', '.pdf']
    
    def extract_text_from_image(self, image_path):
        """Extract text from image file using OCR"""
        try:
            image = Image.open(image_path)
            text = pytesseract.image_to_string(image, config='--psm 6')
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from image {image_path}: {e}")
            return ""
    
    def extract_text_from_pdf(self, pdf_path):
        """Extract text from PDF file (works with scanned PDFs)"""
        try:
            pages = convert_from_path(pdf_path, dpi=300)
            extracted_text = ""
            
            for i, page in enumerate(pages):
                text = pytesseract.image_to_string(page, config='--psm 6')
                extracted_text += f"\\n--- Page {i+1} ---\\n{text}"
            
            return extracted_text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF {pdf_path}: {e}")
            return ""
    
    def extract_text(self, file_path):
        """Extract text based on file extension"""
        file_ext = Path(file_path).suffix.lower()
        
        if file_ext in ['.png', '.jpg', '.jpeg', '.heic']:
            return self.extract_text_from_image(file_path)
        elif file_ext == '.pdf':
            return self.extract_text_from_pdf(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
    
    def extract_structured_data(self, text):
        """Use Gemini AI to extract structured data from OCR text"""
        prompt = f"""
        You are an expert information extraction assistant for academic certificates and marksheets.
        
        From the following OCR text, extract the following information and return it as a valid JSON object:
        
        {{
            "certificate_id": "string or null",
            "student_name": "string or null", 
            "roll_number": "string or null",
            "marks": "string or null (can be grade, CGPA, percentage, etc.)",
            "course": "string or null (degree/program name)",
            "institution": "string or null (college/university name)",
            "issue_date": "string or null (in YYYY-MM-DD format if possible)",
            "raw_text": "the complete extracted text",
            "confidence": 0.85
        }}
        
        Guidelines:
        - If any field is not found or unclear, set it to null
        - For marks, include any grade/score information (CGPA, percentage, grade letters)
        - For dates, try to standardize to YYYY-MM-DD format
        - Be conservative with confidence score based on text clarity
        - Include the complete raw text for reference
        
        OCR Text:
        {text}
        
        Respond only with valid JSON, no additional text or formatting.
        """
        
        try:
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean up common formatting issues
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            # Parse JSON
            data = json.loads(response_text)
            
            # Add processing metadata
            data['processing_timestamp'] = datetime.now().isoformat()
            data['raw_text'] = text
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            # Return basic structure with raw text
            return {
                "certificate_id": None,
                "student_name": None,
                "roll_number": None,
                "marks": None,
                "course": None,
                "institution": None,
                "issue_date": None,
                "raw_text": text,
                "confidence": 0.3,
                "processing_timestamp": datetime.now().isoformat(),
                "error": "Failed to parse AI response"
            }
        except Exception as e:
            logger.error(f"Error with Gemini API: {e}")
            return {
                "certificate_id": None,
                "student_name": None,
                "roll_number": None,
                "marks": None,
                "course": None,
                "institution": None,
                "issue_date": None,
                "raw_text": text,
                "confidence": 0.2,
                "processing_timestamp": datetime.now().isoformat(),
                "error": str(e)
            }
    
    def process_file(self, file_path):
        """Complete processing pipeline for a certificate file"""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Extract text using OCR
        logger.info(f"Extracting text from {file_path}")
        raw_text = self.extract_text(file_path)
        
        if not raw_text.strip():
            logger.warning("No text extracted from file")
            return {
                "certificate_id": None,
                "student_name": None,
                "roll_number": None,
                "marks": None,
                "course": None,
                "institution": None,
                "issue_date": None,
                "raw_text": "",
                "confidence": 0.0,
                "processing_timestamp": datetime.now().isoformat(),
                "error": "No text extracted"
            }
        
        # Extract structured data using AI
        logger.info("Processing text with AI for structured data extraction")
        structured_data = self.extract_structured_data(raw_text)
        
        return structured_data

def main():
    parser = argparse.ArgumentParser(description='Extract structured data from certificates')
    parser.add_argument('--file-path', required=True, help='Path to certificate file')
    parser.add_argument('--output-format', default='json', choices=['json'], help='Output format')
    
    args = parser.parse_args()
    
    try:
        ocr = CertificateOCR()
        result = ocr.process_file(args.file_path)
        
        # Output JSON to stdout for Node.js to capture
        print(json.dumps(result, ensure_ascii=False, indent=None))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "processing_timestamp": datetime.now().isoformat(),
            "confidence": 0.0
        }
        print(json.dumps(error_result, ensure_ascii=False, indent=None))
        sys.exit(1)

if __name__ == "__main__":
    main()
