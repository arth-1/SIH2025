# # Install dependencies

# import os
# import pytesseract
# pytesseract.pytesseract.tesseract_cmd = r"C:/Program Files/Tesseract-OCR/tesseract.exe"
# from PIL import Image
# from pdf2image import convert_from_path
# import google.generativeai as genai

# # ------------- OCR FUNCTIONS -------------
# def ocr_image(img_path):
#     """Extract text from image file"""
#     text = pytesseract.image_to_string(Image.open(img_path))
#     return text

# def pdf_to_text(pdf_path):
#     """Extract text from PDF file (scanned or digital)"""
#     pages = convert_from_path(pdf_path)
#     extracted_text = ""
#     for i, page in enumerate(pages):
#         text = pytesseract.image_to_string(page)
#         extracted_text += f"\n--- Page {i+1} ---\n{text}"
#     return extracted_text

# # ------------- GEMINI API CONFIG -------------
# # Make sure you set your API key
# # Example: os.environ["GEMINI_API_KEY"] = "your_api_key_here"
# genai.configure(api_key="AIzaSyBkTtiE1qEAaj4nAgnTErtydb0a7AG2jzw")


# model = genai.GenerativeModel("gemini-1.5-flash")  # or gemini-1.5-pro if available

# def extract_certificate_details(text: str):
#     """Send raw OCR text to Gemini and ask for structured JSON"""
#     prompt = f"""
#     You are an information extraction assistant.
#     From the following OCR text of a certificate/marksheet, extract:
#     - name
#     - roll_number
#     - marks
#     - certificate_id

#     If any field is missing, return it as null.

#     OCR text:
#     {text}

#     Respond only in valid JSON format.
#     """
#     response = model.generate_content(prompt)
#     return response.text

# # ------------- MASTER FUNCTION -------------
# def process_file(file_path):
#     """Detect file type, run OCR, and extract JSON"""
#     if file_path.lower().endswith((".png", ".jpg", ".jpeg", ".heic")):
#         text = ocr_image(file_path)
#     elif file_path.lower().endswith(".pdf"):
#         text = pdf_to_text(file_path)
#     else:
#         raise ValueError("Unsupported file format")

#     json_output = extract_certificate_details(text)
#     return json_output


# # ------------- EXAMPLE RUN -------------
# if __name__ == "__main__":
#     file_path = "Sem1_Marksheet.pdf"   # or "/content/Test_certificate.png"
#     output_json = process_file(file_path)
#     print(output_json)


import os
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import google.generativeai as genai
import json
from pymongo import MongoClient
from datetime import datetime

# ------------- CONFIG -------------
# Tesseract path (adjust if installed elsewhere)
pytesseract.pytesseract.tesseract_cmd = r"C:/Program Files/Tesseract-OCR/tesseract.exe"

# MongoDB connection
MONGO_URI = "mongodb+srv://salokherudra1_db_user:PSEPS1gHT9PMYRc6@cluster0.utvdkrm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = "certificateDB"
COLLECTION_NAME = "certificates"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
certificates_collection = db[COLLECTION_NAME]

# Gemini API
genai.configure(api_key="AIzaSyBkTtiE1qEAaj4nAgnTErtydb0a7AG2jzw")
model = genai.GenerativeModel("gemini-1.5-flash")

# ------------- OCR FUNCTIONS -------------
def ocr_image(img_path):
    """Extract text from image file"""
    return pytesseract.image_to_string(Image.open(img_path))

def pdf_to_text(pdf_path):
    """Extract text from PDF file (scanned or digital)"""
    pages = convert_from_path(pdf_path)
    extracted_text = ""
    for i, page in enumerate(pages):
        text = pytesseract.image_to_string(page)
        extracted_text += f"\n--- Page {i+1} ---\n{text}"
    return extracted_text

# ------------- GEMINI EXTRACTION -------------
def extract_certificate_details(text: str):
    """Send raw OCR text to Gemini and ask for structured JSON"""
    prompt = f"""
    You are an information extraction assistant.
    From the following OCR text of a certificate/marksheet, extract:
    - certificate_id
    - name
    - roll_number
    - marks

    If any field is missing, return it as null.

    OCR text:
    {text}

    Respond only in valid JSON format.
    """
    response = model.generate_content(prompt)
    try:
        return json.loads(response.text)
    except:
        print("⚠️ Gemini returned non-JSON:", response.text)
        return {}

# ------------- VERIFICATION FUNCTION -------------
def verify_certificate(extracted_data):
    """Compare extracted certificate JSON with MongoDB record"""
    certificate_id = extracted_data.get("certificate_id")

    record = certificates_collection.find_one({"certificateId": certificate_id})
    if not record:
        status = "not_verified"
        reason = "No matching certificate found in DB"
        return {"status": status, "reason": reason}

    match_count, total_fields = 0, 0

    # Compare fields
    if extracted_data.get("name"):
        total_fields += 1
        if record["studentName"].lower() == extracted_data["name"].lower():
            match_count += 1

    if extracted_data.get("roll_number"):
        total_fields += 1
        if record["rollNumber"].lower() == extracted_data["roll_number"].lower():
            match_count += 1

    if extracted_data.get("marks"):
        total_fields += 1
        if record["grade"].lower() == extracted_data["marks"].lower():
            match_count += 1

    # Decide status
    if match_count == total_fields and total_fields > 0:
        status = "verified"
    elif match_count > 0:
        status = "partially_verified"
    else:
        status = "not_verified"

    # Update DB with verification status
    certificates_collection.update_one(
        {"_id": record["_id"]},
        {"$set": {"verificationStatus": status, "lastVerified": datetime.utcnow()}}
    )

    return {"status": status, "matchCount": match_count, "totalFields": total_fields}

# ------------- MASTER FUNCTION -------------
def process_file(file_path):
    """Full pipeline: OCR -> Gemini -> Verify -> DB update"""
    if file_path.lower().endswith((".png", ".jpg", ".jpeg", ".heic")):
        text = ocr_image(file_path)
    elif file_path.lower().endswith(".pdf"):
        text = pdf_to_text(file_path)
    else:
        raise ValueError("Unsupported file format")

    extracted_json = extract_certificate_details(text)
    print("Extracted JSON:", extracted_json)

    result = verify_certificate(extracted_json)
    print("Verification Result:", result)

    return result


# ------------- EXAMPLE RUN -------------
if __name__ == "__main__":
    file_path = "Sem1_Marksheet.pdf"   # replace with your file path
    process_file(file_path)
