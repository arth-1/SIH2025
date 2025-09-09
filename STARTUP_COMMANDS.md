# 🚀 Certificate Verification System - Complete Startup Commands

## Prerequisites
1. Ensure all dependencies are installed
2. Environment files (.env) are configured
3. Open 4 separate PowerShell terminals

## Step-by-Step Startup Commands

### 🔗 Step 1: Start Hardhat Blockchain Node (Terminal 1)
```powershell
cd "d:\Projects\SIH2025\SIH2025\backend\blockchain"
npm run node
```
**Wait for:** `Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/`
**Note:** This will show 20 test accounts with 10000 ETH each

---

### 🖥️ Step 2: Start Backend Server (Terminal 2)
```powershell
cd "d:\Projects\SIH2025\SIH2025\backend"
npm run dev
```
**Wait for:** `🚀 Server running on port 5000`
**Note:** Backend will auto-deploy contracts and connect to blockchain

---

### 🌐 Step 3: Start Frontend Server (Terminal 3)
```powershell
cd "d:\Projects\SIH2025\SIH2025"
npm run dev
```
**Wait for:** `Ready - started server on 0.0.0.0:3000`
**Access:** http://localhost:3000

---

### 🤖 Step 4: Start AI Service (Terminal 4) - Optional
```powershell
cd "d:\Projects\SIH2025\SIH2025"
npm run genkit:dev
```
**Note:** Only needed if using Genkit AI features

---

## 🔗 Service URLs
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Backend Health:** http://localhost:5000/api/health
- **Blockchain RPC:** http://localhost:8545
- **AI Service:** http://localhost:3100 (if running)

## 🧪 Testing Commands
After all services are running:

```powershell
# Test environment configuration
python setup_env.py validate

# Run integration tests
python test_integrated_system_with_env.py

# Quick health check
curl http://localhost:5000/api/health
```

## 🛑 Stopping Services
- **Ctrl+C** in each terminal to stop services
- Stop in reverse order: AI → Frontend → Backend → Blockchain

## ⚠️ Troubleshooting
- If port conflicts occur, check if services are already running
- Ensure .env files have correct values (especially GEMINI_API_KEY)
- Blockchain must start first, then backend, then frontend
- Check terminal outputs for specific error messages
