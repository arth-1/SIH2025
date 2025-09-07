# 🚀 SIH2025 Certificate System - AUTOMATIC STARTUP

## ✨ **ONE COMMAND TO RULE THEM ALL**

```bash
cd backend
npm run auto
```

**That's it!** Everything else happens automatically:

✅ **Blockchain node starts automatically**  
✅ **Smart contract deploys automatically**  
✅ **Backend server starts automatically**  
✅ **Certificate registration is automatic**  
✅ **Everything persists across restarts**  

---

## 🎯 **What Happens Automatically**

### **When You Run `npm run auto`:**

1. **🔍 Checks if blockchain is running**
   - If not → Starts Hardhat node automatically
   - If yes → Uses existing node

2. **🔨 Checks if contract is deployed**
   - If not → Deploys CertificateRegistry automatically
   - If yes → Uses existing contract

3. **🚀 Starts backend server**
   - Connects to MongoDB
   - Loads blockchain service
   - Ready for certificate operations

4. **📋 Ready for automatic operations**
   - Upload certificate → Auto-registered on blockchain
   - Verify certificate → Auto-checked on blockchain
   - No manual steps required!

---

## 🎉 **Complete Workflow (All Automatic)**

### **Institution Registration:**
- Visit `/auth/signup` 
- Create account → **Automatically stored in MongoDB**

### **Certificate Upload:**
- Upload file → **Automatically:**
  - Hashed with SHA-256
  - Stored in MongoDB
  - **Registered on blockchain contract**
  - Watermarked for security
  - Transaction hash returned

### **Certificate Verification:**
- Enter certificate ID → **Automatically:**
  - Checked in MongoDB
  - **Verified on blockchain**
  - File integrity validated
  - Results returned instantly

---

## 🔄 **Restart Behavior**

When you restart everything:

```bash
# Stop all (Ctrl+C)
# Then start again:
npm run auto
```

**Everything persists:**
- ✅ MongoDB data (always persistent)
- ✅ Blockchain data (configured for persistence)
- ✅ Smart contracts (automatically redeployed if needed)
- ✅ Certificate records (never lost)

---

## 🛠️ **Alternative Commands**

```bash
# Full automatic startup
npm run auto

# Full automatic startup (alternative)
npm run full

# Manual development mode (if you prefer)
npm run dev
```

---

## 🎯 **Production Ready Features**

### **Real Blockchain Integration**
- ✅ Real smart contracts
- ✅ Real transaction hashes
- ✅ Real gas costs
- ✅ Real cryptographic security

### **Real Database Operations**
- ✅ MongoDB Atlas cloud database
- ✅ Real user authentication
- ✅ Real certificate storage
- ✅ Real file processing

### **Automatic Everything**
- ✅ No manual deployment steps
- ✅ No manual registration needed
- ✅ No configuration required
- ✅ Just run and use!

---

## 🎉 **You're Done!**

Your certificate management system now has:
- **Complete automation** (no manual steps)
- **Real blockchain integration** (no dummy data)
- **Persistent storage** (survives restarts)
- **Production-ready features** (real everything)

**Just run `npm run auto` and start uploading certificates!** 🚀
