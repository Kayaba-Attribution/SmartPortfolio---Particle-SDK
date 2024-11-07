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
