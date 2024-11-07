import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, formatEther, parseEther, Signer } from "ethers";

const addresses = require("../addresses.json");

describe("SmartBasket", function () {
  let smartBasket: Contract;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let usdt: Contract;

  const usdtAmount = parseEther("1000");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const SmartBasket = await ethers.getContractFactory("SmartBasket");
    smartBasket = await SmartBasket.deploy(addresses.core.Router, addresses.tokens.USDT);
    const smartBasketAddress = await smartBasket.getAddress();

    usdt = await ethers.getContractAt("ERC20_BASE", addresses.tokens.USDT);

    // Mint some USDT to users for testing
    await usdt.mint(await user1.getAddress(), usdtAmount);
    await usdt.mint(await user2.getAddress(), usdtAmount);

    // Approve USDT spending for the smart basket contract
    await usdt.connect(user1).approve(smartBasketAddress, usdtAmount);
    await usdt.connect(user2).approve(smartBasketAddress, usdtAmount);
  });

  it("Should deploy the contract correctly", async function () {
    expect(await smartBasket.uniswapRouter()).to.equal(addresses.core.Router);
    expect(await smartBasket.usdtToken()).to.equal(addresses.tokens.USDT);
  });

  it("Should create a basket", async function () {
    const allocations = [
      { tokenAddress: addresses.tokens.ETH, percentage: 50, amount: 0 },
      { tokenAddress: addresses.tokens.WBTC, percentage: 50, amount: 0 },
    ];

    await expect(smartBasket.connect(user1).createBasket(allocations, parseEther("100")))
      .to.emit(smartBasket, "BasketCreated")
      .withArgs(await user1.getAddress(), 0, parseEther("100"));

    const userBaskets = await smartBasket.getUserBaskets(await user1.getAddress());
    expect(userBaskets.length).to.equal(1);
    expect(userBaskets[0].tokenCount).to.equal(2);
    expect(userBaskets[0].investmentValue).to.equal(parseEther("100"));
    
    // Check that amounts are set after creation
    expect(userBaskets[0].allocations[0].amount).to.be.gt(0);
    expect(userBaskets[0].allocations[1].amount).to.be.gt(0);
  });

  it("Should not create a basket with invalid allocations", async function () {
    const invalidAllocations = [
      { tokenAddress: addresses.tokens.ETH, percentage: 50, amount: 0 },
      { tokenAddress: addresses.tokens.WBTC, percentage: 40, amount: 0 },
    ];

    await expect(smartBasket.connect(user1).createBasket(invalidAllocations, parseEther("100")))
      .to.be.revertedWith("Total percentage must be 100");
  });

  it("Should sell a basket", async function () {
    const allocations = [
      { tokenAddress: addresses.tokens.ETH, percentage: 50, amount: 0 },
      { tokenAddress: addresses.tokens.WBTC, percentage: 50, amount: 0 },
    ];

    await smartBasket.connect(user1).createBasket(allocations, parseEther("100"));

    const initialUsdtBalance = await usdt.balanceOf(await user1.getAddress());

    await smartBasket.connect(user1).sellBasket(0);

    const finalUsdtBalance = await usdt.balanceOf(await user1.getAddress());
    expect(finalUsdtBalance - initialUsdtBalance).to.be.closeTo(
      parseEther("100"),
      parseEther("1"), // Allow for some slippage
    );

    const userBaskets = await smartBasket.getUserBaskets(await user1.getAddress());
    expect(userBaskets.length).to.equal(0);
  });

  it("Should not sell a non-existent basket", async function () {
    await expect(smartBasket.connect(user1).sellBasket(0))
      .to.be.revertedWith("Invalid basket index");
  });

  it("Should handle multiple baskets for a user", async function () {
    const allocations1 = [
      { tokenAddress: addresses.tokens.ETH, percentage: 100, amount: 0 },
    ];
    const allocations2 = [
      { tokenAddress: addresses.tokens.WBTC, percentage: 50, amount: 0 },
      { tokenAddress: addresses.tokens.XRP, percentage: 50, amount: 0 },
    ];

    await smartBasket.connect(user1).createBasket(allocations1, parseEther("50"));
    await smartBasket.connect(user1).createBasket(allocations2, parseEther("50"));

    const userBaskets = await smartBasket.getUserBaskets(await user1.getAddress());
    expect(userBaskets.length).to.equal(2);
    expect(userBaskets[0].tokenCount).to.equal(1);
    expect(userBaskets[1].tokenCount).to.equal(2);
  });

  it("Should get the total value of a basket", async function () {
    const allocations = [
      { tokenAddress: addresses.tokens.ETH, percentage: 50, amount: 0 },
      { tokenAddress: addresses.tokens.WBTC, percentage: 50, amount: 0 },
    ];

    await smartBasket.connect(user1).createBasket(allocations, parseEther("100"));

    const totalValue = await smartBasket.getBasketTotalValue(await user1.getAddress(), 0);
    
    expect(totalValue).to.be.closeTo(
      parseEther("100"),
      parseEther("5") // Allow for some slippage and price fluctuations
    );
  });

  it("Should get asset details of a basket", async function () {
    const allocations = [
      { tokenAddress: addresses.tokens.ETH, percentage: 60, amount: 0 },
      { tokenAddress: addresses.tokens.WBTC, percentage: 40, amount: 0 },
    ];

    await smartBasket.connect(user1).createBasket(allocations, parseEther("100"));

    const [tokenAddresses, tokenAmounts, tokenValues] = await smartBasket.getBasketAssetDetails(await user1.getAddress(), 0);

    expect(tokenAddresses.length).to.equal(2);
    expect(tokenAmounts.length).to.equal(2);
    expect(tokenValues.length).to.equal(2);

    expect(tokenAddresses[0]).to.equal(addresses.tokens.ETH);
    expect(tokenAddresses[1]).to.equal(addresses.tokens.WBTC);

    expect(tokenAmounts[0]).to.be.gt(0);
    expect(tokenAmounts[1]).to.be.gt(0);

    expect(tokenValues[0]).to.be.closeTo(
      parseEther("60"),
      parseEther("3") // Allow for some slippage
    );
    expect(tokenValues[1]).to.be.closeTo(
      parseEther("40"),
      parseEther("2") // Allow for some slippage
    );
  });

  it("Should revert when getting total value of a non-existent basket", async function () {
    await expect(smartBasket.getBasketTotalValue(await user1.getAddress(), 0))
      .to.be.revertedWith("Invalid basket index");
  });

  it("Should revert when getting asset details of a non-existent basket", async function () {
    await expect(smartBasket.getBasketAssetDetails(await user1.getAddress(), 0))
      .to.be.revertedWith("Invalid basket index");
  });

  it("Should handle multiple baskets when getting total value and asset details", async function () {
    const allocations1 = [
      { tokenAddress: addresses.tokens.ETH, percentage: 100, amount: 0 },
    ];
    const allocations2 = [
      { tokenAddress: addresses.tokens.WBTC, percentage: 50, amount: 0 },
      { tokenAddress: addresses.tokens.XRP, percentage: 50, amount: 0 },
    ];

    await smartBasket.connect(user1).createBasket(allocations1, parseEther("50"));
    await smartBasket.connect(user1).createBasket(allocations2, parseEther("50"));

    const totalValue1 = await smartBasket.getBasketTotalValue(await user1.getAddress(), 0);
    const totalValue2 = await smartBasket.getBasketTotalValue(await user1.getAddress(), 1);

    expect(totalValue1).to.be.closeTo(parseEther("50"), parseEther("2.5"));
    expect(totalValue2).to.be.closeTo(parseEther("50"), parseEther("2.5"));

    const [tokenAddresses1, tokenAmounts1, tokenValues1] = await smartBasket.getBasketAssetDetails(await user1.getAddress(), 0);
    const [tokenAddresses2, tokenAmounts2, tokenValues2] = await smartBasket.getBasketAssetDetails(await user1.getAddress(), 1);

    expect(tokenAddresses1.length).to.equal(1);
    expect(tokenAddresses2.length).to.equal(2);

    expect(tokenValues1[0]).to.be.closeTo(parseEther("50"), parseEther("2.5"));
    expect(tokenValues2[0] + tokenValues2[1]).to.be.closeTo(parseEther("50"), parseEther("2.5"));
  });
});