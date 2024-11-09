// nextjs/utils/scaffold-eth/riskUtils.ts
import addresses from "../../contracts/addresses.json";

export type RiskLevel = "Low Risk" | "Medium Risk" | "High Risk" | "Extreme Risk";

export type RiskData = {
  name: RiskLevel;
  value: number;
  color: string;
};

export type TokenRisk = {
  address: string;
  symbol: string;
  riskLevel: RiskLevel;
  description: string;
};

export type PortfolioPlan = {
  name: RiskLevel;
  riskColor: string;
  description: string;
  allocations: Array<{
    tokenAddress: string;
    percentage: number;
    amount: number;
    symbol: string;
    riskLevel: RiskLevel;
  }>;
};

// Risk level definitions
export const RISK_LEVELS: Record<RiskLevel, RiskData> = {
  "Low Risk": { name: "Low Risk", value: 35, color: "#4ade80" },
  "Medium Risk": { name: "Medium Risk", value: 30, color: "#facc15" },
  "High Risk": { name: "High Risk", value: 25, color: "#fb923c" },
  "Extreme Risk": { name: "Extreme Risk", value: 10, color: "#ef4444" },
};

// Token risk classifications
export const TOKEN_RISK_MAPPING: Record<string, TokenRisk> = {
  USDT: {
    address: addresses.tokens.USDT,
    symbol: "USDT",
    riskLevel: "Low Risk",
    description: "Stablecoin pegged to USD",
  },
  WNEO: {
    address: addresses.tokens.WNEO,
    symbol: "WNEO",
    riskLevel: "Medium Risk",
    description: "Wrapped NEO token",
  },
  WBTC: {
    address: addresses.tokens.WBTC,
    symbol: "WBTC",
    riskLevel: "Medium Risk",
    description: "Wrapped Bitcoin",
  },
  XRP: {
    address: addresses.tokens.XRP,
    symbol: "XRP",
    riskLevel: "High Risk",
    description: "Higher volatility asset",
  },
  UNI: {
    address: addresses.tokens.UNI,
    symbol: "UNI",
    riskLevel: "High Risk",
    description: "Governance token",
  },
  LINK: {
    address: addresses.tokens.LINK,
    symbol: "LINK",
    riskLevel: "High Risk",
    description: "Oracle network token",
  },
  DOGE: {
    address: addresses.tokens.DOGE,
    symbol: "DOGE",
    riskLevel: "Extreme Risk",
    description: "Meme coin",
  },
  SHIB: {
    address: addresses.tokens.SHIB,
    symbol: "SHIB",
    riskLevel: "Extreme Risk",
    description: "Meme token",
  },
  PEPE: {
    address: addresses.tokens.PEPE,
    symbol: "PEPE",
    riskLevel: "Extreme Risk",
    description: "Meme token",
  },
  FLOKI: {
    address: addresses.tokens.FLOKI,
    symbol: "FLOKI",
    riskLevel: "Extreme Risk",
    description: "Meme token",
  },
};

// Predefined portfolio plans with risk levels
export const PORTFOLIO_PLANS: PortfolioPlan[] = [
  {
    name: "Low Risk",
    riskColor: RISK_LEVELS["Low Risk"].color,
    description: "Conservative portfolio focused on stability",
    allocations: [
      {
        tokenAddress: addresses.tokens.WBASE,
        symbol: "WBASE",
        percentage: 60,
        amount: 0,
        riskLevel: "Medium Risk",
      },
      {
        tokenAddress: addresses.tokens.WBTC,
        symbol: "WBTC",
        percentage: 20,
        amount: 0,
        riskLevel: "Medium Risk",
      },
      {
        tokenAddress: addresses.tokens.XRP,
        symbol: "XRP",
        percentage: 20,
        amount: 0,
        riskLevel: "High Risk",
      },
    ],
  },
  {
    name: "Medium Risk",
    riskColor: RISK_LEVELS["Medium Risk"].color,
    description: "Balanced portfolio with moderate risk",
    allocations: [
      {
        tokenAddress: addresses.tokens.UNI,
        symbol: "UNI",
        percentage: 50,
        amount: 0,
        riskLevel: "High Risk",
      },
      {
        tokenAddress: addresses.tokens.LINK,
        symbol: "LINK",
        percentage: 50,
        amount: 0,
        riskLevel: "High Risk",
      },
    ],
  },
  {
    name: "High Risk",
    riskColor: RISK_LEVELS["High Risk"].color,
    description: "Aggressive portfolio with high volatility",
    allocations: [
      {
        tokenAddress: addresses.tokens.DOGE,
        symbol: "DOGE",
        percentage: 25,
        amount: 0,
        riskLevel: "Extreme Risk",
      },
      {
        tokenAddress: addresses.tokens.SHIB,
        symbol: "SHIB",
        percentage: 25,
        amount: 0,
        riskLevel: "Extreme Risk",
      },
      {
        tokenAddress: addresses.tokens.PEPE,
        symbol: "PEPE",
        percentage: 25,
        amount: 0,
        riskLevel: "Extreme Risk",
      },
      {
        tokenAddress: addresses.tokens.FLOKI,
        symbol: "FLOKI",
        percentage: 25,
        amount: 0,
        riskLevel: "Extreme Risk",
      },
    ],
  },
];

// Helper functions
export const getTokenRisk = (symbol: string): TokenRisk | undefined => {
  return TOKEN_RISK_MAPPING[symbol];
};

export const getTokenRiskByAddress = (address: string): TokenRisk | undefined => {
  return Object.values(TOKEN_RISK_MAPPING).find(token => token.address.toLowerCase() === address.toLowerCase());
};

export const getRiskColor = (riskLevel: RiskLevel): string => {
  return RISK_LEVELS[riskLevel].color;
};

export const calculatePortfolioRiskLevel = (
  allocations: Array<{ tokenAddress: string; percentage: number }>,
): RiskLevel => {
  let riskScore = 0;
  const riskWeights = {
    "Low Risk": 1,
    "Medium Risk": 2,
    "High Risk": 3,
    "Extreme Risk": 4,
  };

  allocations.forEach(allocation => {
    const token = getTokenRiskByAddress(allocation.tokenAddress);
    if (token) {
      riskScore += (riskWeights[token.riskLevel] * allocation.percentage) / 100;
    }
  });

  if (riskScore <= 1.5) return "Low Risk";
  if (riskScore <= 2.5) return "Medium Risk";
  if (riskScore <= 3.5) return "High Risk";
  return "Extreme Risk";
};

// Get background color class based on risk level
export const getRiskColorClass = (riskLevel: RiskLevel): string => {
  const colorClasses = {
    "Low Risk": "bg-success text-success-content",
    "Medium Risk": "bg-warning text-warning-content",
    "High Risk": "bg-orange-500 text-black-700",
    "Extreme Risk": "bg-error text-error-content",
  };
  return colorClasses[riskLevel] || "";
};

// Get border color class based on risk level
export const getRiskBorderClass = (riskLevel: RiskLevel): string => {
  const borderClasses = {
    "Low Risk": "border-success",
    "Medium Risk": "border-warning",
    "High Risk": "border-orange-400",
    "Extreme Risk": "border-error",
  };
  return borderClasses[riskLevel] || "";
};
