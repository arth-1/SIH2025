#!/usr/bin/env python3
"""
Test script for the integrated AI certificate processing system
"""

import sys
import os
import json
import requests
import time
from pathlib import Path

# Add the AI scripts directory to Python path
script_dir = Path(__file__).parent
ai_dir = script_dir / 'ai'
sys.path.append(str(ai_dir))

def test_ocr_extraction():
    """Test the OCR data extraction"""
    print("🧪 Testing OCR Data Extraction...")
    
    try:
        from enhanced_ocr import CertificateOCR
        
        # Test with a sample certificate
        cert_path = ai_dir / 'Signature-Recognition-with-SiameseNetwork-and-CycleGAN' / 'data' / 'cert1.jpg'
        
        if not cert_path.exists():
            print(f"❌ Sample certificate not found: {cert_path}")
            return False
        
        ocr = CertificateOCR()
        result = ocr.process_file(str(cert_path))
        
        print("✅ OCR extraction successful!")
        print(f"   Extracted data: {json.dumps(result, indent=2)}")
        return True
        
    except Exception as e:
        print(f"❌ OCR test failed: {e}")
        return False

def test_signature_verification():
    """Test signature verification pipeline"""
    print("🧪 Testing Signature Verification...")
    
    try:
        import subprocess
        
        # Test paths
        cert_path = ai_dir / 'Signature-Recognition-with-SiameseNetwork-and-CycleGAN' / 'data' / 'cert1.jpg'
        anchor_path = ai_dir / 'Signature-Recognition-with-SiameseNetwork-and-CycleGAN' / 'data' / '04_066.png'
        script_path = ai_dir / 'Signature-Recognition-with-SiameseNetwork-and-CycleGAN' / 'pipeline_yolo_to_signet.py'
        
        if not all(p.exists() for p in [cert_path, anchor_path, script_path]):
            print("❌ Required files missing for signature verification test")
            return False
        
        # Run the signature verification script
        result = subprocess.run([
            sys.executable, str(script_path),
            '--certificate-path', str(cert_path),
            '--anchor-path', str(anchor_path),
            '--output-format', 'json'
        ], capture_output=True, text=True, cwd=str(script_path.parent))
        
        if result.returncode == 0:
            output = json.loads(result.stdout)
            print("✅ Signature verification successful!")
            print(f"   Results: {json.dumps(output, indent=2)}")
            return True
        else:
            print(f"❌ Signature verification failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Signature verification test failed: {e}")
        return False

def test_api_endpoints():
    """Test the API endpoints"""
    print("🧪 Testing API Endpoints...")
    
    base_url = "http://localhost:5000/api"
    
    try:
        # Test health endpoint
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False
        
        # Test analytics endpoint
        response = requests.get(f"{base_url}/ai-certificates/analytics", timeout=5)
        if response.status_code == 200:
            print("✅ Analytics endpoint working")
            analytics = response.json()
            print(f"   Analytics: {json.dumps(analytics, indent=2)}")
        else:
            print(f"⚠️ Analytics endpoint not ready: {response.status_code}")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server. Make sure the backend is running.")
        return False
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def test_file_upload_simulation():
    """Simulate file upload to API"""
    print("🧪 Testing File Upload Simulation...")
    
    try:
        cert_path = ai_dir / 'Signature-Recognition-with-SiameseNetwork-and-CycleGAN' / 'data' / 'cert1.jpg'
        
        if not cert_path.exists():
            print(f"❌ Test certificate not found: {cert_path}")
            return False
        
        # Prepare form data
        files = {'certificate': open(cert_path, 'rb')}
        data = {
            'institutionCode': 'TEST_INST',
            'institutionName': 'Test Institution'
        }
        
        # Test upload endpoint
        response = requests.post(
            "http://localhost:5000/api/ai-certificates/upload",
            files=files,
            data=data,
            timeout=30
        )
        
        files['certificate'].close()
        
        if response.status_code == 200:
            result = response.json()
            print("✅ File upload successful!")
            print(f"   Result: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"❌ File upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server for upload test")
        return False
    except Exception as e:
        print(f"❌ Upload test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Integrated Certificate System Tests\\n")
    
    tests = [
        ("OCR Data Extraction", test_ocr_extraction),
        ("Signature Verification", test_signature_verification),
        ("API Endpoints", test_api_endpoints),
        ("File Upload Simulation", test_file_upload_simulation)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\\n{'='*50}")
        print(f"Testing: {test_name}")
        print('='*50)
        
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ Test '{test_name}' crashed: {e}")
            results.append((test_name, False))
        
        time.sleep(1)  # Brief pause between tests
    
    # Summary
    print(f"\\n{'='*50}")
    print("TEST SUMMARY")
    print('='*50)
    
    passed = 0
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if success:
            passed += 1
    
    print(f"\\nTotal: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("\\n🎉 All tests passed! The integrated system is working correctly.")
        return 0
    else:
        print(f"\\n⚠️ {len(results) - passed} tests failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
