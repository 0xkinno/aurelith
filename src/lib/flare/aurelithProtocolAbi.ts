// Generated from the compiled AurelithProtocol artifact. Do not edit by hand.
export const AURELITH_PROTOCOL_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "fdcVerification_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "resultAuthorizer_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "CancellationUnavailable",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DuplicateRecipient",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidActionResultSignature",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidActionResultStatus",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidExpiry",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidParticipants",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidShares",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "enum AurelithProtocol.Status",
        "name": "expected",
        "type": "uint8"
      },
      {
        "internalType": "enum AurelithProtocol.Status",
        "name": "actual",
        "type": "uint8"
      }
    ],
    "name": "InvalidState",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NonceMismatch",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PolicyExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PolicyExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PolicyMissing",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ProofInvalid",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ProofReplayed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ResultMismatch",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ResultReplayed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TeeRegistryUnavailable",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TransferFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Unauthorized",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "actionId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "actionResultHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "ActionResultAccepted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "computationReference",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "privateInputHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "nonce",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ComputationRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "instructionSender",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "extensionId",
        "type": "uint256"
      }
    ],
    "name": "InstructionSenderConfigured",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "refundableAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "PolicyCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "paymentReferenceHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "ruleHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "participantHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "targetAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "expiry",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address[]",
        "name": "recipients",
        "type": "address[]"
      },
      {
        "indexed": false,
        "internalType": "uint16[]",
        "name": "sharesBps",
        "type": "uint16[]"
      }
    ],
    "name": "PolicyCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "funder",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalFunded",
        "type": "uint256"
      }
    ],
    "name": "PolicyFunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "PolicyReady",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "PolicyRefunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "requestReference",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ProofRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "proofDigest",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "sourceTransactionHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "sourceBlock",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "sourceTimestamp",
        "type": "uint256"
      }
    ],
    "name": "ProofVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "resultDigest",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "computationReference",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "nonce",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "expiry",
        "type": "uint256"
      }
    ],
    "name": "ResultAuthenticated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "currentAuthorizer",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "pendingAuthorizer",
        "type": "address"
      }
    ],
    "name": "ResultAuthorizerTransferStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousAuthorizer",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newAuthorizer",
        "type": "address"
      }
    ],
    "name": "ResultAuthorizerTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "resultDigest",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "nonce",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address[]",
        "name": "recipients",
        "type": "address[]"
      },
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "name": "SettlementExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "registry",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "extensionId",
        "type": "uint256"
      }
    ],
    "name": "TeeRegistryConfigured",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BPS_DENOMINATOR",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_PARTICIPANTS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "VERSION",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "acceptResultAuthorizerRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "activeTeeRegistry",
    "outputs": [
      {
        "internalType": "contract IActiveTeeSet",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "policyId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "externalProofDigest",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "privateInputHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "computationReference",
            "type": "bytes32"
          },
          {
            "internalType": "address[]",
            "name": "recipients",
            "type": "address[]"
          },
          {
            "internalType": "uint256[]",
            "name": "amounts",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "total",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "nonce",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "expiry",
            "type": "uint64"
          }
        ],
        "internalType": "struct AurelithProtocol.SettlementResult",
        "name": "result",
        "type": "tuple"
      },
      {
        "internalType": "bytes32",
        "name": "actionId",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "submissionTag",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "actionStatus",
        "type": "uint8"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "authenticateActionResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      }
    ],
    "name": "cancelPolicy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IAurelithFccInstructionSender",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "configureInstructionSender",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IActiveTeeSet",
        "name": "registry",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "extensionId",
        "type": "uint256"
      }
    ],
    "name": "configureTeeRegistry",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "salt",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "ruleHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "paymentReferenceHash",
            "type": "bytes32"
          },
          {
            "internalType": "uint128",
            "name": "targetAmount",
            "type": "uint128"
          },
          {
            "internalType": "uint64",
            "name": "expiry",
            "type": "uint64"
          },
          {
            "internalType": "address[]",
            "name": "recipients",
            "type": "address[]"
          },
          {
            "internalType": "uint16[]",
            "name": "sharesBps",
            "type": "uint16[]"
          }
        ],
        "internalType": "struct AurelithProtocol.CreatePolicyParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "createPolicy",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fccInstructionSender",
    "outputs": [
      {
        "internalType": "contract IAurelithFccInstructionSender",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fdcVerification",
    "outputs": [
      {
        "internalType": "contract IFdcVerification",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      }
    ],
    "name": "fundPolicy",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      }
    ],
    "name": "getParticipants",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "recipients",
        "type": "address[]"
      },
      {
        "internalType": "uint16[]",
        "name": "sharesBps",
        "type": "uint16[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      }
    ],
    "name": "getPolicy",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "createdAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "expiry",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "proofRequestedAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "proofVerifiedAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "resultAuthenticatedAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "settledAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "resultNonce",
            "type": "uint64"
          },
          {
            "internalType": "uint128",
            "name": "targetAmount",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "fundedAmount",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "settledAmount",
            "type": "uint128"
          },
          {
            "internalType": "bytes32",
            "name": "ruleHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "paymentReferenceHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "participantHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "externalProofDigest",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "sourceTransactionHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "privateInputHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "resultDigest",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "computationReference",
            "type": "bytes32"
          },
          {
            "internalType": "enum AurelithProtocol.Status",
            "name": "status",
            "type": "uint8"
          }
        ],
        "internalType": "struct AurelithProtocol.Policy",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "policyId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "externalProofDigest",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "privateInputHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "computationReference",
            "type": "bytes32"
          },
          {
            "internalType": "address[]",
            "name": "recipients",
            "type": "address[]"
          },
          {
            "internalType": "uint256[]",
            "name": "amounts",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "total",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "nonce",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "expiry",
            "type": "uint64"
          }
        ],
        "internalType": "struct AurelithProtocol.SettlementResult",
        "name": "result",
        "type": "tuple"
      }
    ],
    "name": "hashSettlementResult",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "ownerNonces",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingResultAuthorizer",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      }
    ],
    "name": "refundPolicy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "requestReference",
        "type": "bytes32"
      }
    ],
    "name": "requestProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "resultAuthorizer",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "privateInputHash",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "message",
        "type": "bytes"
      }
    ],
    "name": "sendComputationInstruction",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "instructionId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "policyId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "externalProofDigest",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "privateInputHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "computationReference",
            "type": "bytes32"
          },
          {
            "internalType": "address[]",
            "name": "recipients",
            "type": "address[]"
          },
          {
            "internalType": "uint256[]",
            "name": "amounts",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "total",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "nonce",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "expiry",
            "type": "uint64"
          }
        ],
        "internalType": "struct AurelithProtocol.SettlementResult",
        "name": "result",
        "type": "tuple"
      }
    ],
    "name": "settle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newAuthorizer",
        "type": "address"
      }
    ],
    "name": "startResultAuthorizerTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "policyId",
        "type": "bytes32"
      },
      {
        "components": [
          {
            "internalType": "bytes32[]",
            "name": "merkleProof",
            "type": "bytes32[]"
          },
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "attestationType",
                "type": "bytes32"
              },
              {
                "internalType": "bytes32",
                "name": "sourceId",
                "type": "bytes32"
              },
              {
                "internalType": "uint64",
                "name": "votingRound",
                "type": "uint64"
              },
              {
                "internalType": "uint64",
                "name": "lowestUsedTimestamp",
                "type": "uint64"
              },
              {
                "components": [
                  {
                    "internalType": "bytes32",
                    "name": "transactionHash",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "uint16",
                    "name": "requiredConfirmations",
                    "type": "uint16"
                  },
                  {
                    "internalType": "bool",
                    "name": "provideInput",
                    "type": "bool"
                  },
                  {
                    "internalType": "bool",
                    "name": "listEvents",
                    "type": "bool"
                  },
                  {
                    "internalType": "uint32[]",
                    "name": "logIndices",
                    "type": "uint32[]"
                  }
                ],
                "internalType": "struct IEVMTransaction.RequestBody",
                "name": "requestBody",
                "type": "tuple"
              },
              {
                "components": [
                  {
                    "internalType": "uint64",
                    "name": "blockNumber",
                    "type": "uint64"
                  },
                  {
                    "internalType": "uint64",
                    "name": "timestamp",
                    "type": "uint64"
                  },
                  {
                    "internalType": "address",
                    "name": "sourceAddress",
                    "type": "address"
                  },
                  {
                    "internalType": "bool",
                    "name": "isDeployment",
                    "type": "bool"
                  },
                  {
                    "internalType": "address",
                    "name": "receivingAddress",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "value",
                    "type": "uint256"
                  },
                  {
                    "internalType": "bytes",
                    "name": "input",
                    "type": "bytes"
                  },
                  {
                    "internalType": "uint8",
                    "name": "status",
                    "type": "uint8"
                  },
                  {
                    "components": [
                      {
                        "internalType": "uint32",
                        "name": "logIndex",
                        "type": "uint32"
                      },
                      {
                        "internalType": "address",
                        "name": "emitterAddress",
                        "type": "address"
                      },
                      {
                        "internalType": "bytes32[]",
                        "name": "topics",
                        "type": "bytes32[]"
                      },
                      {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                      },
                      {
                        "internalType": "bool",
                        "name": "removed",
                        "type": "bool"
                      }
                    ],
                    "internalType": "struct IEVMTransaction.Event[]",
                    "name": "events",
                    "type": "tuple[]"
                  }
                ],
                "internalType": "struct IEVMTransaction.ResponseBody",
                "name": "responseBody",
                "type": "tuple"
              }
            ],
            "internalType": "struct IEVMTransaction.Response",
            "name": "data",
            "type": "tuple"
          }
        ],
        "internalType": "struct IEVMTransaction.Proof",
        "name": "proof",
        "type": "tuple"
      }
    ],
    "name": "submitEvmProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "teeExtensionId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "teeRegistryConfigured",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "usedProofDigests",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "usedResultDigests",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
