"use client";

import React, { useEffect, useState } from "react";
import { useSmartAccountContext } from "../components/SmartAccountContext";
import { TotalPortfolioChart } from "../components/TotalPortfolioChart";
import { PortfolioDistribution } from "../components/ui/PortfolioDistribution";
import addresses from "../contracts/addresses.json";
import SmartPortfolioABI from "../contracts/artifacts/SmartBasket.json";
import CreatePortfolio from "./CreatePortfolio";
import Faucet from "./Faucet";
import GetTokenBalance from "./GetTokenBalance";
import GetUserPortfolios from "./GetUserPortfolios";
import { PortfolioProvider } from "./PortfolioContext";
import Swap from "./Swap";
import { formatEther } from "ethers";
import { useReadContract } from "wagmi";
import {
  ArrowPathIcon,
  CubeTransparentIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const HomeContent: React.FC = () => {
  const projectId = process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID as string;
  const clientKey = process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY as string;
  const appId = process.env.NEXT_PUBLIC_PARTICLE_APP_ID as string;

  console.log({ projectId, clientKey, appId });

  const { smartAccountAddress: connectedAddress } = useSmartAccountContext();

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

  // const { portfolioDetails } = usePortfolioContext();

  // console.log(JSON.stringify(portfolioDetails));
  return (
    <div className="flex flex-col min-h-screen">
      <div className="pt-8 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            SmartPortfolio: Web3 Made Simple with Particle Network
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Chain Abstraction Hackathon Submission - Empowering everyone crypto journey through social login and gasless
            transactions
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 glow">
        <h2 className="text-3xl font-bold mb-4 text-center">Project Overview</h2>
        <p className="text-lg mb-6 text-gray-300 text-center">
          SmartPortfolio revolutionizes DeFi accessibility by leveraging Particle Network Account Abstraction and social
          login capabilities.
          <br></br>Built on Base Sepolia, it demonstrates how modern Web3 infrastructure can deliver Web2-like
          experiences for portfolio management.
        </p>
        <div className="font-bold text-2xl text-center p-4">
          Empower non-technical users to easily and safely invest in diversified cryptocurrency portfolios
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg glow">
          <h3 className="text-2xl font-semibold mb-4">Particle Network Integration</h3>
          <ul className="space-y-4">
            <li className="flex items-center">
              <UserGroupIcon className="h-6 w-6 mr-4 text-blue-400" />
              <span>One-click social login via Particle Connect</span>
            </li>
            <li className="flex items-center">
              <WalletIcon className="h-6 w-6 mr-4 text-blue-400" />
              <span>Gasless transactions through Account Abstraction</span>
            </li>
            <li className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 mr-4 text-blue-400" />
              <span>Smart account management without seed phrases</span>
            </li>
            <li className="flex items-center">
              <CubeTransparentIcon className="h-6 w-6 mr-4 text-blue-400" />
              <span>Complete UX abstraction for seamless interactions</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg glow">
          <h3 className="text-2xl font-semibold mb-4">Portfolio Features</h3>
          <ul className="space-y-4">
            <li className="flex items-center">
              <LightBulbIcon className="h-6 w-6 mr-4 text-purple-400" />
              <span>Customizable portfolios with up to 5 tokens</span>
            </li>
            <li className="flex items-center">
              <ArrowPathIcon className="h-6 w-6 mr-4 text-purple-400" />
              <span>Risk-based templates for different strategies</span>
            </li>
            <li className="flex items-center">
              <CubeTransparentIcon className="h-6 w-6 mr-4 text-purple-400" />
              <span>Real-time portfolio valuation</span>
            </li>
            <li className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 mr-4 text-purple-400" />
              <span>One-click portfolio liquidation</span>
            </li>
          </ul>
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
                      <Address address={connectedAddress as `0x${string}`} />
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
                          <Address address={address as `0x${string}`} />
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
                  <TotalPortfolioChart />
                </div>
              </div>
              <div className="card bg-base-200 shadow-xl glow">
                <div className="card-body">
                  <GetUserPortfolios />
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
            <p className="text-xl mb-4">Please connect your wallet to use Smart Portfolio.</p>
          </div>
        )}
      </main>
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
