// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CredentialRegistry {
    mapping(address => bool) public authorizedIssuers;
    mapping(bytes32 => bool) public revokedRoots;
    mapping(bytes32 => bool) public revokedCredentials;
    bytes32 public latestMerkleRoot;
    address public owner;

    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    event MerkleRootCommitted(bytes32 indexed root);
    event CredentialRevoked(bytes32 indexed credentialHash);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, 'Only owner');
        _;
    }

    function authorizeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    function revokeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }

    function commitMerkleRoot(bytes32 merkleRoot) external {
        require(authorizedIssuers[msg.sender], 'Issuer not authorized');
        latestMerkleRoot = merkleRoot;
        emit MerkleRootCommitted(merkleRoot);
    }

    function revokeMerkleRoot(bytes32 merkleRoot) external onlyOwner {
        revokedRoots[merkleRoot] = true;
    }

    function revokeCredential(bytes32 credentialHash) external onlyOwner {
        revokedCredentials[credentialHash] = true;
        emit CredentialRevoked(credentialHash);
    }
}
