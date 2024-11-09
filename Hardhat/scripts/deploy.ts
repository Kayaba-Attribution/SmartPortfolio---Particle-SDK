import { ethers } from "hardhat";
import { Contract, ContractFactory, parseEther, Signer } from "ethers";
import { parseUnits } from "ethers";
import yargs from "yargs";

// Import artifacts
import WETH9 from "../WETH9.json";
import factoryArtifact from "@uniswap/v2-core/build/UniswapV2Factory.json";
import routerArtifact from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import pairArtifact from "@uniswap/v2-periphery/build/IUniswapV2Pair.json";

import fs from "fs";

// Interfaces
interface DeployedCore {
  factory: any;
  router: any;
  weth: any;
}

interface TokenInfo {
  contract: any;
  address: string;
}

const MaxUint256 = ethers.MaxUint256;

// Function to read addresses from file
function readAddresses(): any {
  try {
    return JSON.parse(fs.readFileSync('addresses.json', 'utf8'));
  } catch (error) {
    return { core: {}, tokens: {} };
  }
}

// Function to write addresses to file
function writeAddresses(addresses: any) {
  fs.writeFileSync('addresses.json', JSON.stringify(addresses, null, 2));
}

function checkCoreAddresses() {
  const addresses = readAddresses();
  if (!addresses.core.Factory || !addresses.core.WETH || !addresses.core.Router) {
    console.error("Core contracts not deployed. Run with DEPLOY_CORE=true");
    process.exit(1);
  }
}

function checkTokenAddresses() {
  const addresses = readAddresses();
  if (!addresses.tokens.USDT || !addresses.tokens.WBASE || !addresses.tokens.WBTC || !addresses.tokens.XRP || !addresses.tokens.UNI || !addresses.tokens.LINK || !addresses.tokens.DOGE || !addresses.tokens.SHIB || !addresses.tokens.PEPE || !addresses.tokens.FLOKI) {
    console.error("Tokens not deployed. Run with DEPLOY_TOKENS=true");
    process.exit(1);
  }
}

// Deploy core contracts (Factory, Router, WETH)
async function deployCore(owner: Signer, addresses: any): Promise<DeployedCore> {
  if (!addresses.core.Factory) {
    const Factory = new ContractFactory(factoryArtifact.abi, factoryArtifact.bytecode, owner);
    const factory = await Factory.deploy(await owner.getAddress());
    addresses.core.Factory = await factory.getAddress();
    writeAddresses(addresses);
    console.log(`Factory deployed to ${addresses.core.Factory}`);
  } else {
    console.log(`Using existing Factory at ${addresses.core.Factory}`);
  }

  if (!addresses.core.WETH) {
    const WETH = new ContractFactory(WETH9.abi, WETH9.bytecode, owner);
    const weth = await WETH.deploy();
    addresses.core.WETH = await weth.getAddress();
    writeAddresses(addresses);
    console.log(`WETH deployed to ${addresses.core.WETH}`);
  } else {
    console.log(`Using existing WETH at ${addresses.core.WETH}`);
  }

  if (!addresses.core.Router) {
    const Router = new ContractFactory(routerArtifact.abi, routerArtifact.bytecode, owner);
    const router = await Router.deploy(addresses.core.Factory, addresses.core.WETH);
    addresses.core.Router = await router.getAddress();
    writeAddresses(addresses);
    console.log(`Router deployed to ${addresses.core.Router}`);
  } else {
    console.log(`Using existing Router at ${addresses.core.Router}`);
  }

  return {
    factory: await ethers.getContractAt(factoryArtifact.abi, addresses.core.Factory),
    router: await ethers.getContractAt(routerArtifact.abi, addresses.core.Router),
    weth: await ethers.getContractAt(WETH9.abi, addresses.core.WETH)
  };
}

// Deploy a new ERC20 token based on ERC20_BASE
async function deployToken(owner: Signer, name: string, symbol: string, addresses: any): Promise<TokenInfo> {
  if (!addresses.tokens[symbol]) {
    const ERC20_BASE = await ethers.getContractFactory("ERC20_BASE");
    const token = await ERC20_BASE.deploy(name, symbol);
    addresses.tokens[symbol] = await token.getAddress();
    writeAddresses(addresses);
    console.log(`${name} deployed to ${addresses.tokens[symbol]}`);
  } else {
    console.log(`Using existing ${symbol} at ${addresses.tokens[symbol]}`);
  }

  return {
    contract: await ethers.getContractAt("ERC20_BASE", addresses.tokens[symbol]),
    address: addresses.tokens[symbol]
  };
}

// Mint tokens, create pair, approve, and add liquidity
async function setupTokenPair(
  owner: Signer,
  factory: any,
  router: any,
  token: any,
  usdt: any,
  targetPriceUSD: number
) {
  const ownerAddress = await owner.getAddress();

  // Mint tokens
  const tokenAmount = parseUnits("1000", 18);
  const usdtAmount = parseUnits((1000 * targetPriceUSD).toString(), 18); // Assuming USDT has 18 decimals

  await token.connect(owner).mint(ownerAddress, tokenAmount);
  await usdt.connect(owner).mint(ownerAddress, usdtAmount);

  // Create pair
  const tokenAddress = await token.getAddress();
  const usdtAddress = await usdt.getAddress();

  console.log("Creating pair...");
  const createPairTx = await factory.createPair(tokenAddress, usdtAddress);
  console.log("Waiting for pair creation transaction to be mined...");
  const receipt = await createPairTx.wait();
  console.log(`Pair creation transaction mined. Transaction hash: ${receipt.transactionHash}`);
  
  console.log("Getting pair address...");
  const pairAddress = await factory.getPair(tokenAddress, usdtAddress);
  console.log(`Pair created at ${pairAddress}`);
  
  if (pairAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error("Pair creation failed: returned zero address");
  }
  // Approve router
  const routerAddress = await router.getAddress();
  await token.connect(owner).approve(routerAddress, MaxUint256);
  await usdt.connect(owner).approve(routerAddress, MaxUint256);

  // Add liquidity
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now
  await router.connect(owner).addLiquidity(
    tokenAddress,
    usdtAddress,
    tokenAmount,
    usdtAmount,
    0,
    0,
    ownerAddress,
    deadline
  );

  console.log(`Liquidity added for ${await token.symbol()} / USDT pair | Target price: ${targetPriceUSD}`);
}

async function deploySmartBasket(owner: Signer, router: any, usdt: any, addresses: any) {
  if (!addresses.core.SmartBasket) {
    console.log(`Deploying SmartBasket with Router: ${router} and USDT: ${usdt}`);
    const SmartBasket = await ethers.getContractFactory("SmartBasket");
    const customBasket = await SmartBasket.deploy(router, usdt);
    addresses.core.SmartBasket = await customBasket.getAddress();
    writeAddresses(addresses);
    console.log(`SmartBasket deployed to ${addresses.core.SmartBasket}`);
  } else {
    console.log(`Using existing SmartBasket at ${addresses.core.SmartBasket}`);
  }

  return await ethers.getContractAt("SmartBasket", addresses.core.SmartBasket);
}



async function main() {
  const deployCoreFlag = process.env.DEPLOY_CORE === 'true';
  const deployTokens = process.env.DEPLOY_TOKENS === 'true';
  const setupPairs = process.env.SETUP_PAIRS === 'true';
  const deployBasket = process.env.DEPLOY_BASKET === 'true';
  const deployAll = process.env.DEPLOY_ALL === 'true';
  const deployUSDT = process.env.DEPLOY_USDT === 'true';

  const [owner] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${owner.address}`);

  const balanceBefore = await ethers.provider.getBalance(owner.address);
  let addresses = readAddresses();

  if (deployCoreFlag || deployAll) {
    console.log("Deploying core contracts...");
    const core = await deployCore(owner, addresses);
  }

  if (deployUSDT) {
    console.log("Deploying USDT...");
    const usdt = await deployToken(owner, "Tether USD", "USDT", addresses);
  }

  if (deployTokens || deployAll) {
    console.log("Deploying tokens...");
    // checkCoreAddresses();
    //const usdt = await deployToken(owner, "Tether USD", "USDT", addresses);
    const eth = await deployToken(owner, "Wrapped Base", "WBASE", addresses);
    const wbtc = await deployToken(owner, "Wrapped Bitcoin", "WBTC", addresses);
    const xrp = await deployToken(owner, "Ripple", "XRP", addresses);
    const uni = await deployToken(owner, "Uniswap", "UNI", addresses);
    const link = await deployToken(owner, "Chainlink", "LINK", addresses);
    const doge = await deployToken(owner, "Dogecoin", "DOGE", addresses);
    const shib = await deployToken(owner, "Shiba Inu", "SHIB", addresses);
    const pepe = await deployToken(owner, "Pepe", "PEPE", addresses);
    const floki = await deployToken(owner, "Floki Inu", "FLOKI", addresses);
  }

  if (setupPairs || deployAll) {
    console.log("Setting up token pairs...");
    checkCoreAddresses();
    checkTokenAddresses();
    const core = {
      factory: await ethers.getContractAt(factoryArtifact.abi, addresses.core.Factory),
      router: await ethers.getContractAt(routerArtifact.abi, addresses.core.Router),
    };
    const usdt = await ethers.getContractAt("ERC20_BASE", addresses.tokens.USDT);

    // await setupTokenPair(owner, core.factory, core.router, await ethers.getContractAt("ERC20_BASE", addresses.tokens.ETH), usdt, 2000);
    await setupTokenPair(owner, core.factory, core.router, await ethers.getContractAt("ERC20_BASE", addresses.tokens.WBASE), usdt, 9.8);
    await setupTokenPair(owner, core.factory, core.router, await ethers.getContractAt("ERC20_BASE", addresses.tokens.WBTC), usdt, 60000);
    await setupTokenPair(owner, core.factory, core.router, await ethers.getContractAt("ERC20_BASE", addresses.tokens.XRP), usdt, 0.5);
    await setupTokenPair(owner, core.factory, core.router, await ethers.getContractAt("ERC20_BASE", addresses.tokens.UNI), usdt, 5);
    await setupTokenPair(owner, core.factory, core.router, await ethers.getContractAt("ERC20_BASE", addresses.tokens.LINK), usdt, 15);
    await setupTokenPair(owner, core.factory, core.router, await ethers.getContractAt("ERC20_BASE", addresses.tokens.DOGE), usdt, 0.1);
    await setupTokenPair(owner, core.factory, core.router, await ethers.getContractAt("ERC20_BASE", addresses.tokens.SHIB), usdt, 0.000008);
    await setupTokenPair(owner, core.factory, core.router, await ethers.getContractAt("ERC20_BASE", addresses.tokens.PEPE), usdt, 0.000001);
    await setupTokenPair(owner, core.factory, core.router, await ethers.getContractAt("ERC20_BASE", addresses.tokens.FLOKI), usdt, 0.00002);
  }

  if (deployBasket || deployAll) {
    console.log("Deploying SmartBasket...");
    if (!addresses.core.Router || !addresses.tokens.USDT) {
      console.error("Router or USDT address not found. Make sure to deploy core contracts and tokens first.");
      return;
    }
    const SmartBasket = await deploySmartBasket(owner, addresses.core.Router, addresses.tokens.USDT, addresses);
  }

  const balanceAfter = await ethers.provider.getBalance(owner.address);
  console.log(`Deployer ETH Balance Change: ${ethers.formatEther(balanceAfter - balanceBefore)}`);
}


// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });