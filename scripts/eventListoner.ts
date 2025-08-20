

// scripts/eventListener.ts
// Standalone event listener script to monitor TradeCreated events in real-time on Sepolia.
// Run with: ts-node scripts/eventListener.ts (install ts-node if needed: yarn add ts-node)
// This listens for events, parses them using the provided ABI, and can forward details to a relayer (e.g., for Solana bridging).
// Uses WebSocket for real-time; fallback to polling if needed.

import { ethers } from "ethers";
import axios from "axios"; // For sending to relayer; install with: yarn add axios

// Deployed contract address
const P2P_INTERCHAIN_ADDRESS = "0xa0b69828018c56DfF55f1e8694b2102Fcb56f0cA";

// Full ABI from the provided artifact (truncated for brevity, but includes the TradeCreated event)
const ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "previousAdmin",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "newAdmin",
                "type": "address"
            }
        ],
        "name": "AdminChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "beacon",
                "type": "address"
            }
        ],
        "name": "BeaconUpgraded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "version",
                "type": "uint8"
            }
        ],
        "name": "Initialized",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "Paused",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "id",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "parentTradeID",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "WithdrawAmount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "CompletionStatus",
                "type": "bool"
            }
        ],
        "name": "SwapCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "id",
                "type": "bytes32"
            }
        ],
        "name": "TradeCancelled",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "id",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "seller",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "endtime",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "MaxBalance",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "currentBalance",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint8[]",
                "name": "getTokens",
                "type": "uint8[]"
            },
            {
                "indexed": false,
                "internalType": "uint256[]",
                "name": "convertionFactors",
                "type": "uint256[]"
            }
        ],
        "name": "TradeCloneCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "id",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "seller",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "sellerGiveTokenIndex",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "bytes4",
                "name": "pairChains",
                "type": "bytes4"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "endtime",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "DepositValue",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "AvailableValue",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "feeAmount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "solanaAddress",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "tokenBWantedAmount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "is_taker_native",
                "type": "bool"
            }
        ],
        "name": "TradeCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "Unpaused",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "implementation",
                "type": "address"
            }
        ],
        "name": "Upgraded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "tradeCloneID",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "index",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "autoWithdraw",
                "type": "bool"
            }
        ],
        "name": "buyerDeposit",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "swapID",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "WithdrawAmount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "CompletionStatus",
                "type": "bool"
            }
        ],
        "name": "withdraw",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_buyer",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "_tradeCloneID",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "_index",
                "type": "uint8"
            },
            {
                "internalType": "bool",
                "name": "_auotWithdraw",
                "type": "bool"
            }
        ],
        "name": "DepositBuyer",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_seller",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "_tokenIndex",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "timespan",
                "type": "uint256"
            },
            {
                "internalType": "bytes4",
                "name": "_destinationChain",
                "type": "bytes4"
            },
            {
                "internalType": "string",
                "name": "_solanaAddress",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_tokenBWantedAmount",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "_is_taker_native",
                "type": "bool"
            }
        ],
        "name": "DepositSeller",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "name": "Whitelistedtokens",
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
                "name": "_id",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "feeAmount",
                "type": "uint256"
            }
        ],
        "name": "cancelTrade",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_tradeCloneID",
                "type": "bytes32"
            }
        ],
        "name": "cancelTradeClone",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "constantFeePercent",
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
        "name": "counter",
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
        "inputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "name": "feeCollected",
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
        "inputs": [
            {
                "internalType": "address",
                "name": "_storage",
                "type": "address"
            }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_swapID",
                "type": "bytes32"
            }
        ],
        "name": "manualWithdrawBuyer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "name": "names",
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
        "name": "owner",
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
        "inputs": [],
        "name": "pause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "paused",
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
        "inputs": [],
        "name": "proxiableUUID",
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
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_percentage",
                "type": "uint256"
            }
        ],
        "name": "setConstantFee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "_index",
                "type": "uint8"
            },
            {
                "internalType": "address",
                "name": "_address",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "uint8",
                "name": "_tokenCount",
                "type": "uint8"
            }
        ],
        "name": "setERCAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_id",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "_parentTradeID",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "_buyer",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "autoTransfer",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "_feeAmount",
                "type": "uint256"
            }
        ],
        "name": "setSwapID",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_id",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "_seller",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_endtime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            },
            {
                "internalType": "uint8[]",
                "name": "_getTokens",
                "type": "uint8[]"
            },
            {
                "internalType": "uint256[]",
                "name": "_convertionFactor",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256",
                "name": "_feeAmount",
                "type": "uint256"
            }
        ],
        "name": "setTradeCloneID",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "storageOracle",
        "outputs": [
            {
                "internalType": "contract IStorageOracle",
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
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "unpause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newImplementation",
                "type": "address"
            }
        ],
        "name": "upgradeTo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newImplementation",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "upgradeToAndCall",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withDrawAllfees",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "_index",
                "type": "uint8"
            }
        ],
        "name": "withdrawFee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];


// Sepolia provider URL (use your own Alchemy/Infura key for WebSocket; e.g., wss://eth-sepolia.g.alchemy.com/v2/YOUR_KEY)
const PROVIDER_URL = "wss://scroll-sepolia.g.alchemy.com/v2/FEHnoqlfzCfgpOYWpnMHNNTcKvk317A2";

// Relayer API endpoint (replace with your Solana relayer service URL)
// const RELAYER_API = "https://your-relayer-service.com/api/bridge-to-solana";

const BLOCK_CHUNK = 500; // Scroll Sepolia limit

async function fetchPastEvents(contract: ethers.Contract, fromBlock: number, toBlock: number) {
    let allEvents: ethers.EventLog[] = [];
    for (let start = fromBlock; start <= toBlock; start += BLOCK_CHUNK) {
        const end = Math.min(start + BLOCK_CHUNK - 1, toBlock); // <= 500 blocks inclusive
        console.log(`📜 Fetching events from block ${start} to ${end}`);
        const events = await contract.queryFilter("TradeCreated", start, end);
        const eventLogs = events.filter((e): e is ethers.EventLog => 'args' in e);
        allEvents = allEvents.concat(eventLogs);
    }
    return allEvents;
}

async function main() {
    const provider = new ethers.WebSocketProvider(PROVIDER_URL);
    const contract = new ethers.Contract(P2P_INTERCHAIN_ADDRESS, ABI, provider);

    const latestBlock = await provider.getBlockNumber();
    const historyFromBlock = latestBlock - 2000; // How far back to search

    // 1️⃣ Fetch past events in chunks
    const pastEvents = await fetchPastEvents(contract, historyFromBlock, latestBlock);
    pastEvents.forEach((event, idx) => {
        const args = event.args;
        if (!args) return;
        console.log(`🕑 Past Event #${idx + 1}:`);
        console.log(`  id:                ${args.id}`);
        console.log(`  seller:            ${args.seller}`);
        console.log(`  sellerGiveTokenIdx:${args.sellerGiveTokenIndex}`);
        console.log(`  pairChains:        ${args.pairChains}`);
        console.log(`  endtime:           ${args.endtime}`);
        console.log(`  DepositValue:      ${args.DepositValue}`);
        console.log(`  AvailableValue:    ${args.AvailableValue}`);
        console.log(`  feeAmount:         ${args.feeAmount}`);
        console.log(`  solanaAddress:     ${args.solanaAddress}`);
        console.log(`  tokenBWantedAmount:${args.tokenBWantedAmount}`);
        console.log(`  is_taker_native:   ${args.is_taker_native}`);
        console.log('----------------------------------------');
    });

    // 2️⃣ Listen for new events in real time
    console.log("👂 Listening for new TradeCreated events...");
    contract.on("TradeCreated", (
        id,
        seller,
        sellerGiveTokenIndex,
        pairChains,
        endtime,
        DepositValue,
        AvailableValue,
        feeAmount,
        solanaAddress,
        tokenBWantedAmount,
        is_taker_native,
        event
    ) => {
        console.log("🚨 New TradeCreated Event:");
        console.log(`  id:                ${id}`);
        console.log(`  seller:            ${seller}`);
        console.log(`  sellerGiveTokenIdx:${sellerGiveTokenIndex}`);
        console.log(`  pairChains:        ${pairChains}`);
        console.log(`  endtime:           ${endtime}`);
        console.log(`  DepositValue:      ${DepositValue}`);
        console.log(`  AvailableValue:    ${AvailableValue}`);
        console.log(`  feeAmount:         ${feeAmount}`);
        console.log(`  solanaAddress:     ${solanaAddress}`);
        console.log(`  tokenBWantedAmount:${tokenBWantedAmount}`);
        console.log(`  is_taker_native:   ${is_taker_native}`);
        console.log('----------------------------------------');
    });

}

main().catch(console.error);