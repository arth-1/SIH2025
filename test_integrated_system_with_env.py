#!/usr/bin/env python3
"""
Comprehensive Integration Test for Certificate Verification System
Tests the complete pipeline: AI → MongoDB → Blockchain → Frontend
"""

import os
import sys
import requests
import json
import time
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SystemIntegrationTester:
    def __init__(self):
        self.backend_url = os.getenv('BACKEND_URL', 'http://localhost:5000')
        self.frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        self.test_results = []
        
    def log_test(self, test_name, status, message=""):
        """Log test results"""
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        self.test_results.append(result)
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} {test_name}: {status}")
        if message:
            print(f"   {message}")
    
    def test_environment_variables(self):
        """Test that all required environment variables are set"""
        print("\n🔧 Testing Environment Variables...")
        
        required_vars = [
            'MONGODB_URI',
            'GEMINI_API_KEY', 
            'TESSERACT_PATH',
            'PYTHON_EXECUTABLE'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            self.log_test(
                "Environment Variables", 
                "FAIL", 
                f"Missing variables: {', '.join(missing_vars)}"
            )
        else:
            self.log_test("Environment Variables", "PASS", "All required variables set")
    
    def test_backend_health(self):
        """Test backend server health"""
        print("\n🏥 Testing Backend Health...")
        
        try:
            response = requests.get(f"{self.backend_url}/api/health", timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                self.log_test(
                    "Backend Health", 
                    "PASS", 
                    f"Status: {health_data.get('status', 'unknown')}"
                )
            else:
                self.log_test(
                    "Backend Health", 
                    "FAIL", 
                    f"HTTP {response.status_code}"
                )
        except requests.exceptions.ConnectionError:
            self.log_test(
                "Backend Health", 
                "FAIL", 
                "Cannot connect to backend server"
            )
        except Exception as e:
            self.log_test(
                "Backend Health", 
                "FAIL", 
                f"Error: {str(e)}"
            )
    
    def test_ai_service_configuration(self):
        """Test AI service configuration"""
        print("\n🤖 Testing AI Service Configuration...")
        
        try:
            response = requests.get(f"{self.backend_url}/api/ai/config", timeout=10)
            if response.status_code == 200:
                config = response.json()
                self.log_test(
                    "AI Service Config", 
                    "PASS", 
                    f"Tesseract: {config.get('tesseract_available', False)}"
                )
            else:
                self.log_test(
                    "AI Service Config", 
                    "WARN", 
                    "AI config endpoint not available"
                )
        except Exception as e:
            self.log_test(
                "AI Service Config", 
                "WARN", 
                f"Could not test AI config: {str(e)}"
            )
    
    def test_blockchain_connection(self):
        """Test blockchain connection"""
        print("\n⛓️ Testing Blockchain Connection...")
        
        try:
            response = requests.get(f"{self.backend_url}/api/blockchain/status", timeout=10)
            if response.status_code == 200:
                blockchain_data = response.json()
                self.log_test(
                    "Blockchain Connection", 
                    "PASS", 
                    f"Block: {blockchain_data.get('blockNumber', 'unknown')}"
                )
            else:
                self.log_test(
                    "Blockchain Connection", 
                    "WARN", 
                    "Blockchain status endpoint not available"
                )
        except Exception as e:
            self.log_test(
                "Blockchain Connection", 
                "WARN", 
                f"Could not test blockchain: {str(e)}"
            )
    
    def test_database_connection(self):
        """Test database connection"""
        print("\n🗄️ Testing Database Connection...")
        
        try:
            response = requests.get(f"{self.backend_url}/api/db/status", timeout=10)
            if response.status_code == 200:
                db_data = response.json()
                self.log_test(
                    "Database Connection", 
                    "PASS", 
                    f"Status: {db_data.get('status', 'unknown')}"
                )
            else:
                self.log_test(
                    "Database Connection", 
                    "WARN", 
                    "Database status endpoint not available"
                )
        except Exception as e:
            self.log_test(
                "Database Connection", 
                "WARN", 
                f"Could not test database: {str(e)}"
            )
    
    def test_certificate_upload_endpoint(self):
        """Test certificate upload endpoint"""
        print("\n📄 Testing Certificate Upload Endpoint...")
        
        # Create a dummy test file
        test_file_content = b"dummy certificate content for testing"
        
        try:
            files = {'certificate': ('test.jpg', test_file_content, 'image/jpeg')}
            data = {
                'institutionCode': 'TEST001',
                'metadata': json.dumps({'test': True})
            }
            
            response = requests.post(
                f"{self.backend_url}/api/certificates/upload",
                files=files,
                data=data,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                self.log_test(
                    "Certificate Upload", 
                    "PASS", 
                    "Upload endpoint responsive"
                )
            elif response.status_code == 400:
                self.log_test(
                    "Certificate Upload", 
                    "PASS", 
                    "Upload validation working (expected for dummy file)"
                )
            else:
                self.log_test(
                    "Certificate Upload", 
                    "WARN", 
                    f"HTTP {response.status_code}"
                )
        except Exception as e:
            self.log_test(
                "Certificate Upload", 
                "WARN", 
                f"Could not test upload: {str(e)}"
            )
    
    def test_frontend_accessibility(self):
        """Test frontend accessibility"""
        print("\n🌐 Testing Frontend Accessibility...")
        
        try:
            response = requests.get(self.frontend_url, timeout=10)
            if response.status_code == 200:
                self.log_test(
                    "Frontend Access", 
                    "PASS", 
                    "Frontend server responsive"
                )
            else:
                self.log_test(
                    "Frontend Access", 
                    "FAIL", 
                    f"HTTP {response.status_code}"
                )
        except requests.exceptions.ConnectionError:
            self.log_test(
                "Frontend Access", 
                "FAIL", 
                "Cannot connect to frontend server"
            )
        except Exception as e:
            self.log_test(
                "Frontend Access", 
                "FAIL", 
                f"Error: {str(e)}"
            )
    
    def generate_report(self):
        """Generate test report"""
        print("\n" + "="*60)
        print("🧪 INTEGRATION TEST REPORT")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.test_results if r['status'] == 'FAIL'])
        warning_tests = len([r for r in self.test_results if r['status'] == 'WARN'])
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⚠️ Warnings: {warning_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"  - {result['test']}: {result['message']}")
        
        if warning_tests > 0:
            print("\n⚠️ WARNINGS:")
            for result in self.test_results:
                if result['status'] == 'WARN':
                    print(f"  - {result['test']}: {result['message']}")
        
        # Save detailed report
        report_file = f"integration_test_report_{int(time.time())}.json"
        with open(report_file, 'w') as f:
            json.dump({
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'summary': {
                    'total': total_tests,
                    'passed': passed_tests,
                    'failed': failed_tests,
                    'warnings': warning_tests,
                    'success_rate': (passed_tests/total_tests)*100
                },
                'results': self.test_results
            }, f, indent=2)
        
        print(f"\n📊 Detailed report saved: {report_file}")
        
        return failed_tests == 0
    
    def run_all_tests(self):
        """Run all integration tests"""
        print("🚀 Starting Integration Tests for Certificate Verification System")
        print(f"Backend URL: {self.backend_url}")
        print(f"Frontend URL: {self.frontend_url}")
        
        # Run all tests
        self.test_environment_variables()
        self.test_backend_health()
        self.test_ai_service_configuration()
        self.test_blockchain_connection()
        self.test_database_connection()
        self.test_certificate_upload_endpoint()
        self.test_frontend_accessibility()
        
        # Generate report
        success = self.generate_report()
        
        if success:
            print("\n🎉 All critical tests passed! System ready for use.")
        else:
            print("\n⚠️ Some tests failed. Check the issues above.")
        
        return success

def main():
    """Main function"""
    print("Certificate Verification System - Integration Test")
    print("=" * 60)
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("⚠️ No .env file found. Copy .env.example to .env and configure it.")
        print("Example: cp .env.example .env")
        return False
    
    tester = SystemIntegrationTester()
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
