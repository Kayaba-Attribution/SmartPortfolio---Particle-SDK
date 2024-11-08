// PortfolioContext.tsx
import React, { createContext, useContext, useState } from "react";
import addresses from "../contracts/addresses.json";
import { formatEther } from "ethers";

export interface PortfolioDetails {
  tokenAddresses: string[];
  tokenPercentages: number[];
  tokenAmounts: bigint[];
  tokenValues: bigint[];
  investmentValue: bigint;
  totalValue: bigint;
}

interface PortfolioContextType {
  refreshPortfolios: boolean;
  setRefreshPortfolios: (refresh: boolean) => void;
  refreshTokenBalances: boolean;
  setRefreshTokenBalances: (refresh: boolean) => void;
  portfolioDetails: PortfolioDetails[];
  setPortfolioDetails: (details: PortfolioDetails[]) => void;
  // Helper functions
  formatValue: (value: bigint) => string;
  calculateROI: (current: bigint, initial: bigint) => string;
  getTokenName: (address: string) => string;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshPortfolios, setRefreshPortfolios] = useState(false);
  const [refreshTokenBalances, setRefreshTokenBalances] = useState(false);
  const [portfolioDetails, setPortfolioDetails] = useState<PortfolioDetails[]>([]);

  // Helper functions
  const formatValue = (value: bigint) => {
    const formatted = parseFloat(formatEther(value)).toFixed(2);
    return formatted === "-0.00" ? "0.00" : formatted;
  };

  const calculateROI = (current: bigint, initial: bigint) => {
    const currentValue = Number(formatValue(current));
    const initialValue = Number(formatValue(initial));
    const roi = ((currentValue - initialValue) / initialValue) * 100;
    return roi.toFixed(2);
  };

  const getTokenName = (address: string) => {
    // Import this from your addresses file
    const tokenOptions = Object.entries(addresses.tokens).map(([name, addr]) => ({ name, address: addr }));
    const token = tokenOptions.find(t => t.address === address);
    return token ? token.name : "Unknown";
  };

  return (
    <PortfolioContext.Provider
      value={{
        refreshPortfolios,
        setRefreshPortfolios,
        refreshTokenBalances,
        setRefreshTokenBalances,
        portfolioDetails,
        setPortfolioDetails,
        formatValue,
        calculateROI,
        getTokenName,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolioContext = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolioContext must be used within a PortfolioProvider");
  }
  return context;
};
