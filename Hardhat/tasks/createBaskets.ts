import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

task("create-baskets", "Creates test baskets in the SmartBasket contract")
    .setAction(async (taskArgs: {}, hre: HardhatRuntimeEnvironment) => {
        const { ethers } = hre;

        const ERC20_BASE_ABI = await import("../artifacts/contracts/ERC20_BASE.sol/ERC20_BASE.json");
        const SmartBasket_ABI = await import("../artifacts/contracts/SmartBasket.sol/SmartBasket.json");    

        // Load the addresses from the JSON file
        const fs = require("fs");
        const addresses = JSON.parse(fs.readFileSync('addresses.json', 'utf-8'));

        // Set up the signer using the private key from .env
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("PRIVATE_KEY not found in .env file");
        }
        const signer = new ethers.Wallet(privateKey, ethers.provider);
        console.log("Using address:", signer.address);

        // Set up contracts
        const smartBasketAddress = addresses.core.SmartBasket;
        const SmartBasket = new ethers.Contract(smartBasketAddress, SmartBasket_ABI.abi, signer);
        const USDT = new ethers.Contract(addresses.tokens.USDT, ERC20_BASE_ABI.abi, signer);

        // Define allocations
        const lowRiskAllocations = [
            { tokenAddress: addresses.tokens.ETH, percentage: 60 },
            { tokenAddress: addresses.tokens.WBTC, percentage: 20 },
            { tokenAddress: addresses.tokens.XRP, percentage: 20 },
        ];
        const mediumRiskAllocations = [
            { tokenAddress: addresses.tokens.UNI, percentage: 50 },
            { tokenAddress: addresses.tokens.LINK, percentage: 50 },
        ];
        const highRiskAllocations = [
            { tokenAddress: addresses.tokens.DOGE, percentage: 25 },
            { tokenAddress: addresses.tokens.SHIB, percentage: 25 },
            { tokenAddress: addresses.tokens.PEPE, percentage: 25 },
            { tokenAddress: addresses.tokens.FLOKI, percentage: 25 },
        ];

        try {
            // Check USDT balance
            const usdtBalance = await USDT.balanceOf(signer.address);
            console.log("USDT balance:", ethers.formatEther(usdtBalance));

            // Approve USDT spending for the smart basket contract
            console.log("Approving USDT spending...");
            const approveTx = await USDT.approve(smartBasketAddress, ethers.MaxUint256);
            await approveTx.wait();
            console.log("USDT spending approved");

            // Create baskets
            console.log("Creating low risk basket...");
            const lowRiskTx = await SmartBasket.createBasket(lowRiskAllocations, parseEther("10000"));
            await lowRiskTx.wait();

            console.log("Creating medium risk basket...");
            const mediumRiskTx = await SmartBasket.createBasket(mediumRiskAllocations, parseEther("1000"));
            await mediumRiskTx.wait();

            console.log("Creating high risk basket...");
            const highRiskTx = await SmartBasket.createBasket(highRiskAllocations, parseEther("100"));
            await highRiskTx.wait();

            // Verify baskets created
            const userBaskets = await SmartBasket.getUserBaskets(signer.address);
            console.log("User baskets created:", userBaskets.length);

        } catch (error) {
            console.error("Error creating baskets:", error);
        }
    });