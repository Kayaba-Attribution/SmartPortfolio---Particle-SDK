"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BasicPortfolioPriceChart } from "../components/BasicPortfolioPriceChart";
import { PortfolioPriceChart } from "../components/PortfolioPriceChart";
import { TokenPriceChart } from "../components/TokenPriceChart";
import { PortfolioDistribution } from "../components/ui/PortfolioDistribution";
import { RiskChart } from "../components/ui/RiskChart";
import addresses from "../contracts/addresses.json";
import SmartPortfolioABI from "../contracts/artifacts/SmartBasket.json";
import CreatePortfolio from "./CreatePortfolio";
import Faucet from "./Faucet";
import GetTokenBalance from "./GetTokenBalance";
import GetUserBaskets from "./GetUserBaskets";
import { PortfolioProvider } from "./PortfolioContext";
import { usePortfolioContext } from "./PortfolioContext";
import Swap from "./Swap";
import { formatEther } from "ethers";
import { useAccount, useReadContract } from "wagmi";
import {
  BugAntIcon,
  CubeTransparentIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const HomeContent: React.FC = () => {
  const { address: connectedAddress } = useAccount();
  const contractAddress = addresses.core.SmartPortfolio;
  const [totalUsdtInvested, setTotalUsdtInvested] = useState("0.00");
  const [isContractsVisible, setIsContractsVisible] = useState(false);
  const [isAllTokensVisible, setIsAllTokensVisible] = useState(false);

  const { data: basketsData } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: SmartPortfolioABI.abi,
    functionName: "getUserBaskets",
    args: [connectedAddress],
  });

  useEffect(() => {
    if (Array.isArray(basketsData)) {
      console.table(JSON.stringify(basketsData));
      const total = basketsData.reduce((sum, basket) => sum + BigInt(basket.investmentValue), BigInt(0));
      setTotalUsdtInvested(formatEther(total));
    }
  }, [basketsData]);

  const tokenEntries = Object.entries(addresses.tokens);

  const tokens = [
    {
      address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      symbol: "WETH",
      percentage: 60,
      color: "#4ade80",
    },
    {
      address: "0x514910771af9ca656af840dff83e8264ecf986ca",
      symbol: "LINK",
      percentage: 40,
      color: "#fb923c",
    },
  ];

  const { portfolioDetails, formatValue, calculateROI, getTokenName } = usePortfolioContext();

  console.log(JSON.stringify(portfolioDetails));
  return (
    <div className="flex flex-col min-h-screen">
      <div className="pt-8 text-center">
        <div className="container mx-auto px-4 glow">
          <h1 className="text-4xl font-extrabold mb-4">
            SmartPortfolio: Customizable Token Portfolio Manager on Neo X
          </h1>
          <p className="text-xl text-base-content opacity-80 max-w-2xl mx-auto mb-8">
            Hackathon Submission for Neo X Code Grinder Challenge
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 glow">
        <h2 className="text-3xl font-bold mb-4">Project Overview</h2>
        <p className="text-lg mb-6">
          SmartPortfolio is an innovative DeFi project built on Neo X, leveraging the power of Neos EVM-compatible
          sidechain to create a seamless and efficient token portfolio management experience. Its a Solidity-based smart
          contract system that allows users to create and manage customizable token portfolios (baskets) using USDT as
          the base currency. The project implements a complete Uniswap V2 fork for token swaps and liquidity provision,
          demonstrating the full compatibility of Neo X with Ethereum tooling and complex DeFi infrastructure.
        </p>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        <div className="flex-1 glow p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-4">Key Features</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Create customized token baskets with up to 5 different tokens</li>
            <li>Invest in baskets using USDT</li>
            <li>Sell baskets and receive USDT</li>
            <li>View basket total value and individual asset details</li>
            <li>Seamless integration with Neo Xs high-performance EVM-based sidechain</li>
            <li>Full Uniswap V2 functionality for efficient token swaps and liquidity provision</li>
          </ul>
        </div>

        <div className="flex-1 glow p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-4">Integration with Neo X</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 mr-4 flex items-center justify-center">
                <LightBulbIcon className="h-6 w-6 text-white" />
              </div>
              <p>Leverages Neo Xs EVM compatibility for complex Solidity contracts</p>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 mr-4 flex items-center justify-center">
                <CubeTransparentIcon className="h-6 w-6 text-white" />
              </div>
              <p>Utilizes Neo Xs high throughput for efficient token swaps and basket management</p>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 mr-4 flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <p>Benefits from Neo Xs dBFT consensus for secure and quick transaction finality</p>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 mr-4 flex items-center justify-center">
                <MagnifyingGlassIcon className="h-6 w-6 text-white" />
              </div>
              <p>Takes advantage of Neo Xs MEV resistance for fair token pricing in Uniswap pools</p>
            </div>
          </div>
        </div>
      </div>
      <main className="flex-grow container mx-auto px-4 py-8">
        {connectedAddress ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 ">
            {/* Left Panel */}
            <div className="md:col-span-1 space-y-8">
              <div className="card bg-base-200 shadow-xl glow">
                <div className="card-body">
                  <h2 className="card-title mb-4">Your Account</h2>
                  <div className="flex flex-col space-y-4">
                    <div>
                      <p className="text-sm opacity-70 mb-1">Connected Address:</p>
                      <Address address={connectedAddress} />
                    </div>
                    <div>
                      <p className="text-sm opacity-70 mb-1">Total Investment:</p>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold">${totalUsdtInvested}</span>
                        <span className="ml-2 text-sm opacity-70">USDT</span>
                      </div>
                    </div>
                    <div className="w-full">
                      {/* <RiskChart /> */}
                      <PortfolioDistribution />
                    </div>
                    <div>
                      <Faucet />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-200 shadow-xl glow">
                <div className="card-body">
                  <h2 className="card-title">Your Token Balances</h2>
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th>Token</th>
                          <th>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tokenEntries.slice(0, 5).map(([name, address]) => (
                          <tr key={name}>
                            <td>{name}</td>
                            <td>
                              <GetTokenBalance
                                contractAddress={address as `0x${string}`}
                                userAddress={connectedAddress as `0x${string}`}
                                contractName={name}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {tokenEntries.length > 5 && (
                    <div>
                      <button
                        className="btn btn-sm btn-ghost mt-2"
                        onClick={() => setIsAllTokensVisible(!isAllTokensVisible)}
                      >
                        {isAllTokensVisible ? "Hide" : "Show More"} Tokens
                      </button>
                      {isAllTokensVisible && (
                        <table className="table w-full mt-2">
                          <tbody>
                            {tokenEntries.slice(5).map(([name, address]) => (
                              <tr key={name}>
                                <td>{name}</td>
                                <td>
                                  <GetTokenBalance
                                    contractAddress={address as `0x${string}`}
                                    userAddress={connectedAddress as `0x${string}`}
                                    contractName={name}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="card bg-base-200 shadow-xl glow">
                <div className="card-body">
                  <h2 className="card-title cursor-pointer" onClick={() => setIsContractsVisible(!isContractsVisible)}>
                    Core Contracts {isContractsVisible ? "▼" : "►"}
                  </h2>
                  {isContractsVisible && (
                    <ul className="space-y-2">
                      {Object.entries(addresses.core).map(([name, address]) => (
                        <li key={name} className="flex flex-col">
                          <span className="font-medium">{name}:</span>
                          <Address address={address} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Center and Right Panels */}
            <div className="md:col-span-2 space-y-8">
              <div className="card bg-base-200 shadow-xl glow">
                <div className="card-body">
                  {/* <PortfolioPriceChart tokens={tokens} initialTimeframe="24h" portfolioId={1} /> */}
                  <BasicPortfolioPriceChart portfolioIndex={0} test={true}/>
                  <BasicPortfolioPriceChart portfolioIndex={1} test={true}/>
                  {/* <TokenPriceChart
                    tokenAddress="0x514910771af9ca656af840dff83e8264ecf986ca"
                    tokenName="WETH"
                    chainId={1}
                    initialTimeframe="24h"
                  /> */}
                </div>
              </div>
              <div className="card bg-base-200 shadow-xl glow">
                <div className="card-body">
                  <GetUserBaskets />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card bg-base-200 shadow-xl glow">
                  <div className="card-body">
                    <CreatePortfolio />
                  </div>
                </div>

                <div className="card bg-base-200 shadow-xl glow">
                  <div className="card-body">
                    <Swap />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl mb-4">Please connect your wallet to use Smart Basket.</p>
          </div>
        )}
      </main>
      <footer className="bg-base-300 py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <p>
                Tinker with your smart contract using the{" "}
                <Link href="/debug" passHref className="link">
                  Debug Contracts
                </Link>{" "}
                tab.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p>
                Explore your local transactions with the{" "}
                <Link href="/blockexplorer" passHref className="link">
                  Block Explorer
                </Link>{" "}
                tab.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Main component that provides the context
const Home: React.FC = () => {
  return (
    <PortfolioProvider>
      <HomeContent />
    </PortfolioProvider>
  );
};

export default Home;
