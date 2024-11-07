import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("mint-tokens", "Mints test tokens to a specified address")
    .addParam("address", "The address to mint tokens to")
    .setAction(async (taskArgs: { address: string }, hre: HardhatRuntimeEnvironment) => {
        const { ethers } = hre;
        const [owner] = await ethers.getSigners();

        const ERC20_BASE_ABI = await import("../artifacts/contracts/ERC20_BASE.sol/ERC20_BASE.json");
        const SmartBasket_ABI = await import("../artifacts/contracts/SmartBasket.sol/SmartBasket.json");    

        // Load the addresses from the JSON file
        const fs = require("fs");
        const addresses = JSON.parse(fs.readFileSync('addresses.json', 'utf-8'));

        // Define token amounts (adjust these as needed for your testing scenario)
        const tokenAmounts = {
            // USDT: ethers.parseUnits("1000000", 18),  // 1 million USDT
            WNEO: ethers.parseUnits("1000", 18),      // 1000 ETH
            WBTC: ethers.parseUnits("50", 18),       // 50 WBTC
            XRP: ethers.parseUnits("100000", 18),    // 100,000 XRP
            UNI: ethers.parseUnits("10000", 18),     // 10,000 UNI
            LINK: ethers.parseUnits("5000", 18),     // 5,000 LINK
            DOGE: ethers.parseUnits("1000000", 18),  // 1 million DOGE
            SHIB: ethers.parseUnits("1000000000", 18), // 1 billion SHIB
            PEPE: ethers.parseUnits("10000000000", 18), // 10 billion PEPE
            FLOKI: ethers.parseUnits("5000000000", 18)  // 5 billion FLOKI
        };


        // Mint tokens
        for (const [tokenName, amount] of Object.entries(tokenAmounts)) {
            const tokenContract = new ethers.Contract(addresses.tokens[tokenName], ERC20_BASE_ABI.abi, owner);

            try {
                const tx = await tokenContract.mint(taskArgs.address, amount);
                await tx.wait();
                console.log(`Minted ${ethers.formatUnits(amount, 18)} ${tokenName} to ${taskArgs.address}`);
            } catch (error) {
                console.error(`Failed to mint ${tokenName}: ${error}`);
            }
        }

        console.log("Token minting process completed");
    });