// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertificateRegistry {
    struct Certificate {
        string studentName;
        string rollNumber;
        string institution;
        string course;
        string grade;
        string certId;
        string documentHash; // Hash of the certificate document
        string metadataHash; // Hash of certificate metadata
        uint256 issuedAt;
        uint256 registeredAt;
        address registeredBy;
        bool isValid;
    }

    struct Institution {
        string name;
        string code;
        address authorizedSigner;
        bool isActive;
        uint256 registeredAt;
    }

    // Mappings
    mapping(string => Certificate) public certificates; // certId => Certificate
    mapping(string => Institution) public institutions; // institutionCode => Institution
    mapping(address => string) public authorizedInstitutions; // address => institutionCode
    mapping(string => bool) public blacklistedCertificates; // certId => blacklisted
    
    // Owner and admin management
    address public owner;
    mapping(address => bool) public admins;
    
    // Events
    event CertificateRegistered(
        string indexed certId, 
        string studentName, 
        string institution, 
        string course,
        address registeredBy
    );
    
    event CertificateVerified(
        string indexed certId, 
        bool isValid, 
        address verifiedBy
    );
    
    event InstitutionRegistered(
        string indexed institutionCode, 
        string name, 
        address authorizedSigner
    );
    
    event CertificateBlacklisted(
        string indexed certId, 
        address blacklistedBy
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner, "Only admin can perform this action");
        _;
    }

    modifier onlyAuthorizedInstitution() {
        require(
            bytes(authorizedInstitutions[msg.sender]).length > 0 && 
            institutions[authorizedInstitutions[msg.sender]].isActive,
            "Only authorized institutions can register certificates"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    // Admin functions
    function addAdmin(address _admin) external onlyOwner {
        admins[_admin] = true;
    }

    function removeAdmin(address _admin) external onlyOwner {
        admins[_admin] = false;
    }

    // Institution management
    function registerInstitution(
        string memory _institutionCode,
        string memory _name,
        address _authorizedSigner
    ) external onlyAdmin {
        require(bytes(institutions[_institutionCode].code).length == 0, "Institution already registered");
        
        institutions[_institutionCode] = Institution({
            name: _name,
            code: _institutionCode,
            authorizedSigner: _authorizedSigner,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        authorizedInstitutions[_authorizedSigner] = _institutionCode;
        
        emit InstitutionRegistered(_institutionCode, _name, _authorizedSigner);
    }

    function deactivateInstitution(string memory _institutionCode) external onlyAdmin {
        institutions[_institutionCode].isActive = false;
    }

    function activateInstitution(string memory _institutionCode) external onlyAdmin {
        institutions[_institutionCode].isActive = true;
    }

    // Certificate registration
    function registerCertificate(
        string memory _studentName,
        string memory _rollNumber,
        string memory _course,
        string memory _grade,
        string memory _certId,
        string memory _documentHash,
        string memory _metadataHash,
        uint256 _issuedAt
    ) external onlyAuthorizedInstitution {
        require(bytes(certificates[_certId].certId).length == 0, "Certificate already exists");
        require(!blacklistedCertificates[_certId], "Certificate ID is blacklisted");
        
        string memory institutionCode = authorizedInstitutions[msg.sender];
        
        certificates[_certId] = Certificate({
            studentName: _studentName,
            rollNumber: _rollNumber,
            institution: institutionCode,
            course: _course,
            grade: _grade,
            certId: _certId,
            documentHash: _documentHash,
            metadataHash: _metadataHash,
            issuedAt: _issuedAt,
            registeredAt: block.timestamp,
            registeredBy: msg.sender,
            isValid: true
        });
        
        emit CertificateRegistered(_certId, _studentName, institutionCode, _course, msg.sender);
    }

    // Bulk certificate registration
    function registerCertificatesBatch(
        string[] memory _studentNames,
        string[] memory _rollNumbers,
        string[] memory _courses,
        string[] memory _grades,
        string[] memory _certIds,
        string[] memory _documentHashes,
        string[] memory _metadataHashes,
        uint256[] memory _issuedAts
    ) external onlyAuthorizedInstitution {
        require(
            _studentNames.length == _rollNumbers.length &&
            _rollNumbers.length == _courses.length &&
            _courses.length == _grades.length &&
            _grades.length == _certIds.length &&
            _certIds.length == _documentHashes.length &&
            _documentHashes.length == _metadataHashes.length &&
            _metadataHashes.length == _issuedAts.length,
            "Array lengths must match"
        );

        string memory institutionCode = authorizedInstitutions[msg.sender];

        for (uint i = 0; i < _certIds.length; i++) {
            if (bytes(certificates[_certIds[i]].certId).length == 0 && !blacklistedCertificates[_certIds[i]]) {
                certificates[_certIds[i]] = Certificate({
                    studentName: _studentNames[i],
                    rollNumber: _rollNumbers[i],
                    institution: institutionCode,
                    course: _courses[i],
                    grade: _grades[i],
                    certId: _certIds[i],
                    documentHash: _documentHashes[i],
                    metadataHash: _metadataHashes[i],
                    issuedAt: _issuedAts[i],
                    registeredAt: block.timestamp,
                    registeredBy: msg.sender,
                    isValid: true
                });
                
                emit CertificateRegistered(_certIds[i], _studentNames[i], institutionCode, _courses[i], msg.sender);
            }
        }
    }

    // Certificate verification
    function verifyCertificate(
        string memory _certId, 
        string memory _documentHash
    ) external returns (bool) {
        Certificate memory cert = certificates[_certId];
        
        if (bytes(cert.certId).length == 0) {
            emit CertificateVerified(_certId, false, msg.sender);
            return false;
        }
        
        if (blacklistedCertificates[_certId] || !cert.isValid) {
            emit CertificateVerified(_certId, false, msg.sender);
            return false;
        }
        
        bool isValidHash = keccak256(bytes(cert.documentHash)) == keccak256(bytes(_documentHash));
        
        emit CertificateVerified(_certId, isValidHash, msg.sender);
        return isValidHash;
    }

    // Get certificate details
    function getCertificate(string memory _certId) external view returns (
        string memory studentName,
        string memory rollNumber,
        string memory institution,
        string memory course,
        string memory grade,
        string memory certId,
        string memory documentHash,
        string memory metadataHash,
        uint256 issuedAt,
        uint256 registeredAt,
        address registeredBy,
        bool isValid
    ) {
        Certificate memory cert = certificates[_certId];
        return (
            cert.studentName,
            cert.rollNumber,
            cert.institution,
            cert.course,
            cert.grade,
            cert.certId,
            cert.documentHash,
            cert.metadataHash,
            cert.issuedAt,
            cert.registeredAt,
            cert.registeredBy,
            cert.isValid && !blacklistedCertificates[_certId]
        );
    }

    // Get institution details
    function getInstitution(string memory _institutionCode) external view returns (
        string memory name,
        string memory code,
        address authorizedSigner,
        bool isActive,
        uint256 registeredAt
    ) {
        Institution memory inst = institutions[_institutionCode];
        return (inst.name, inst.code, inst.authorizedSigner, inst.isActive, inst.registeredAt);
    }

    // Blacklist management
    function blacklistCertificate(string memory _certId) external onlyAdmin {
        blacklistedCertificates[_certId] = true;
        if (bytes(certificates[_certId].certId).length > 0) {
            certificates[_certId].isValid = false;
        }
        emit CertificateBlacklisted(_certId, msg.sender);
    }

    function removeFromBlacklist(string memory _certId) external onlyAdmin {
        blacklistedCertificates[_certId] = false;
        if (bytes(certificates[_certId].certId).length > 0) {
            certificates[_certId].isValid = true;
        }
    }

    // Check if certificate exists
    function certificateExists(string memory _certId) external view returns (bool) {
        return bytes(certificates[_certId].certId).length > 0;
    }

    // Check if certificate is blacklisted
    function isBlacklisted(string memory _certId) external view returns (bool) {
        return blacklistedCertificates[_certId];
    }
}
