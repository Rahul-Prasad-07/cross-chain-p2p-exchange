import { expect } from "chai";
import hre, { ethers } from "hardhat";

// Replace these with your actual deployed contract addresses on Sepolia
const P2P_INTERCHAIN_ADDRESS = "0xa0b69828018c56DfF55f1e8694b2102Fcb56f0cA";
const STORAGE_ORACLE_ADDRESS = "0xCeFfc0Ab8E7B1830d75e56FD1e8827eE1e89F514";
const TOKEN1_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Set this to your deployed token address

// Example test for 'Should create trade' on already deployed contracts

describe("p2pInterchain (deployed) - Should create trade", function () {
    it("Should create trade with native ETH on deployed contract", async function () {
        const [signer] = await hre.ethers.getSigners();
        const signerAddress = await signer.getAddress();

        // Get contract instances at deployed addresses
        const p2pInterchain = await ethers.getContractAt("p2pInterchain", P2P_INTERCHAIN_ADDRESS);
        const storageOracle = await ethers.getContractAt("StorageOracle", STORAGE_ORACLE_ADDRESS);

        // Set up parameters for native ETH (tokenIndex = 0)
        const ethAmount = hre.ethers.parseEther("0.00000041"); // 0.00000041 ETH
        const timespan = 1000000000000;
        const destinationChain = "0x00000001";
        const solanaAddress = "AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns";
        const tokenBWantedAmount = 60000000;

        // Call the depositSeller function with value for native ETH
        const tx = await p2pInterchain.DepositSeller(
            signerAddress, // Seller address
            ethAmount,     // Amount in wei
            0,            // Token index 0 for native ETH
            timespan,
            destinationChain,
            solanaAddress,
            tokenBWantedAmount,
            true,
            { value: ethAmount }
        );
        const receipt = await tx.wait();


        console.log("Transaction hash:", tx.hash);
        console.log("Transaction receipt:", receipt);

        // Find and log the TradeCreated event
        const event = receipt.events?.find((e: any) => e.event === "TradeCreated");
        if (event) {
            console.log("TradeCreated event data:", event.args);
        } else {
            console.log("TradeCreated event not found");
        }

        // Optionally, check that the trade exists in storageOracle
        // You can extract the tradeId from the event if needed
        expect(receipt.status).to.equal(1);
    });
});
