const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
  let certificateRegistry;
  let owner;
  let institution;
  let user;

  beforeEach(async function () {
    // Get signers
    [owner, institution, user] = await ethers.getSigners();

    // Deploy contract
    const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    certificateRegistry = await CertificateRegistry.deploy();
    await certificateRegistry.waitForDeployment();
  });

  describe("Institution Management", function () {
    it("Should register an institution", async function () {
      await certificateRegistry.registerInstitution(
        "MIT001",
        "Massachusetts Institute of Technology",
        institution.address
      );

      const institutionData = await certificateRegistry.getInstitution("MIT001");
      expect(institutionData[0]).to.equal("Massachusetts Institute of Technology");
      expect(institutionData[1]).to.equal("MIT001");
      expect(institutionData[2]).to.equal(institution.address);
      expect(institutionData[3]).to.be.true; // isActive
    });

    it("Should not allow duplicate institution registration", async function () {
      await certificateRegistry.registerInstitution(
        "MIT001",
        "Massachusetts Institute of Technology",
        institution.address
      );

      await expect(
        certificateRegistry.registerInstitution(
          "MIT001",
          "Another Institution",
          user.address
        )
      ).to.be.revertedWith("Institution already registered");
    });
  });

  describe("Certificate Registration", function () {
    beforeEach(async function () {
      // Register institution first
      await certificateRegistry.registerInstitution(
        "MIT001",
        "Massachusetts Institute of Technology",
        institution.address
      );
    });

    it("Should register a certificate", async function () {
      const certData = {
        studentName: "John Doe",
        rollNumber: "2021001",
        course: "Computer Science",
        grade: "A",
        certId: "CS2024001",
        documentHash: "0x1234567890abcdef",
        metadataHash: "0xabcdef1234567890",
        issuedAt: Math.floor(Date.now() / 1000)
      };

      await certificateRegistry.connect(institution).registerCertificate(
        certData.studentName,
        certData.rollNumber,
        certData.course,
        certData.grade,
        certData.certId,
        certData.documentHash,
        certData.metadataHash,
        certData.issuedAt
      );

      const certificate = await certificateRegistry.getCertificate(certData.certId);
      expect(certificate[0]).to.equal(certData.studentName);
      expect(certificate[1]).to.equal(certData.rollNumber);
      expect(certificate[2]).to.equal("MIT001");
      expect(certificate[3]).to.equal(certData.course);
      expect(certificate[4]).to.equal(certData.grade);
      expect(certificate[11]).to.be.true; // isValid
    });

    it("Should not allow unauthorized certificate registration", async function () {
      await expect(
        certificateRegistry.connect(user).registerCertificate(
          "John Doe",
          "2021001",
          "Computer Science",
          "A",
          "CS2024001",
          "0x1234567890abcdef",
          "0xabcdef1234567890",
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith("Only authorized institutions can register certificates");
    });

    it("Should not allow duplicate certificate registration", async function () {
      const certData = {
        studentName: "John Doe",
        rollNumber: "2021001",
        course: "Computer Science",
        grade: "A",
        certId: "CS2024001",
        documentHash: "0x1234567890abcdef",
        metadataHash: "0xabcdef1234567890",
        issuedAt: Math.floor(Date.now() / 1000)
      };

      await certificateRegistry.connect(institution).registerCertificate(
        certData.studentName,
        certData.rollNumber,
        certData.course,
        certData.grade,
        certData.certId,
        certData.documentHash,
        certData.metadataHash,
        certData.issuedAt
      );

      await expect(
        certificateRegistry.connect(institution).registerCertificate(
          "Jane Doe",
          "2021002",
          "Mathematics",
          "B",
          certData.certId, // Same certId
          "0xfedcba0987654321",
          "0x0987654321fedcba",
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith("Certificate already exists");
    });
  });

  describe("Certificate Verification", function () {
    beforeEach(async function () {
      // Register institution and certificate
      await certificateRegistry.registerInstitution(
        "MIT001",
        "Massachusetts Institute of Technology",
        institution.address
      );

      await certificateRegistry.connect(institution).registerCertificate(
        "John Doe",
        "2021001",
        "Computer Science",
        "A",
        "CS2024001",
        "0x1234567890abcdef",
        "0xabcdef1234567890",
        Math.floor(Date.now() / 1000)
      );
    });

    it("Should verify valid certificate", async function () {
      const isValid = await certificateRegistry.verifyCertificate(
        "CS2024001",
        "0x1234567890abcdef"
      );
      expect(isValid).to.be.true;
    });

    it("Should reject invalid document hash", async function () {
      const isValid = await certificateRegistry.verifyCertificate(
        "CS2024001",
        "0xwronghash"
      );
      expect(isValid).to.be.false;
    });

    it("Should reject non-existent certificate", async function () {
      const isValid = await certificateRegistry.verifyCertificate(
        "NONEXISTENT",
        "0x1234567890abcdef"
      );
      expect(isValid).to.be.false;
    });
  });

  describe("Blacklist Management", function () {
    beforeEach(async function () {
      // Register institution and certificate
      await certificateRegistry.registerInstitution(
        "MIT001",
        "Massachusetts Institute of Technology",
        institution.address
      );

      await certificateRegistry.connect(institution).registerCertificate(
        "John Doe",
        "2021001",
        "Computer Science",
        "A",
        "CS2024001",
        "0x1234567890abcdef",
        "0xabcdef1234567890",
        Math.floor(Date.now() / 1000)
      );
    });

    it("Should blacklist certificate", async function () {
      await certificateRegistry.blacklistCertificate("CS2024001");
      
      const isBlacklisted = await certificateRegistry.isBlacklisted("CS2024001");
      expect(isBlacklisted).to.be.true;

      // Should fail verification after blacklisting
      const isValid = await certificateRegistry.verifyCertificate(
        "CS2024001",
        "0x1234567890abcdef"
      );
      expect(isValid).to.be.false;
    });

    it("Should remove from blacklist", async function () {
      await certificateRegistry.blacklistCertificate("CS2024001");
      await certificateRegistry.removeFromBlacklist("CS2024001");
      
      const isBlacklisted = await certificateRegistry.isBlacklisted("CS2024001");
      expect(isBlacklisted).to.be.false;

      // Should pass verification after removing from blacklist
      const isValid = await certificateRegistry.verifyCertificate(
        "CS2024001",
        "0x1234567890abcdef"
      );
      expect(isValid).to.be.true;
    });
  });

  describe("Batch Operations", function () {
    beforeEach(async function () {
      await certificateRegistry.registerInstitution(
        "MIT001",
        "Massachusetts Institute of Technology",
        institution.address
      );
    });

    it("Should register multiple certificates in batch", async function () {
      const certificates = [
        ["John Doe", "2021001", "Computer Science", "A", "CS2024001", "0x1111", "0xaaaa", Math.floor(Date.now() / 1000)],
        ["Jane Smith", "2021002", "Mathematics", "B", "MATH2024001", "0x2222", "0xbbbb", Math.floor(Date.now() / 1000)],
        ["Bob Johnson", "2021003", "Physics", "A", "PHY2024001", "0x3333", "0xcccc", Math.floor(Date.now() / 1000)]
      ];

      await certificateRegistry.connect(institution).registerCertificatesBatch(
        certificates.map(c => c[0]), // studentNames
        certificates.map(c => c[1]), // rollNumbers
        certificates.map(c => c[2]), // courses
        certificates.map(c => c[3]), // grades
        certificates.map(c => c[4]), // certIds
        certificates.map(c => c[5]), // documentHashes
        certificates.map(c => c[6]), // metadataHashes
        certificates.map(c => c[7])  // issuedAts
      );

      // Verify all certificates exist
      for (let i = 0; i < certificates.length; i++) {
        const exists = await certificateRegistry.certificateExists(certificates[i][4]);
        expect(exists).to.be.true;
      }
    });
  });
});
