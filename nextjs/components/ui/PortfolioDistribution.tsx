import React from "react";
import { usePortfolioContext } from "../../app/PortfolioContext";
import { formatEther } from "ethers";
import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";

type TokenDistribution = {
  name: string;
  value: number;
  color: string;
  rawValue: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: TokenDistribution;
  }>;
};

// Token colors - you might want to import these from your risk utils
const TOKEN_COLORS: Record<string, string> = {
  WNEO: "#4ade80",
  WBTC: "#facc15",
  XRP: "#fb923c",
  UNI: "#ef4444",
  LINK: "#3b82f6",
  DOGE: "#8b5cf6",
  SHIB: "#ec4899",
  PEPE: "#f43f5e",
  FLOKI: "#14b8a6",
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: data.color,
          transition: "all 0.2s ease",
        }}
        className="px-2 py-1 rounded shadow-lg text-xs font-medium"
      >
        <p className="whitespace-nowrap text-black">
          {data.name}: {data.value.toFixed(2)}%
          <br />
          Amount: {Number(formatEther(data.rawValue)).toFixed(2)} USDT
        </p>
      </div>
    );
  }
  return null;
};

export function PortfolioDistribution() {
  const { portfolioDetails, getTokenName } = usePortfolioContext();

  // Calculate total distribution across all portfolios
  const calculateDistribution = () => {
    const tokenTotals = new Map<string, { total: bigint; name: string }>();

    // Sum up values for each token across all portfolios
    portfolioDetails.forEach(portfolio => {
      portfolio.tokenAddresses.forEach((address, index) => {
        const tokenName = getTokenName(address);
        const currentValue = portfolio.tokenValues[index];

        if (tokenTotals.has(address)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const existing = tokenTotals.get(address)!;
          tokenTotals.set(address, {
            total: existing.total + currentValue,
            name: tokenName,
          });
        } else {
          tokenTotals.set(address, {
            total: currentValue,
            name: tokenName,
          });
        }
      });
    });

    // Calculate total value across all tokens
    const totalValue = Array.from(tokenTotals.values()).reduce((sum, { total }) => sum + total, 0n);

    // Convert to percentage and format for chart
    const distribution: TokenDistribution[] = Array.from(tokenTotals.entries())
      .map(([, { total, name }]) => ({
        name,
        value: Number((total * 10000n) / totalValue) / 100,
        color: TOKEN_COLORS[name] || "#cbd5e1", // fallback color
        rawValue: total.toString(),
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending

    return distribution;
  };

  const distributionData = calculateDistribution();

  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Portfolio Distribution</h2>
        <div className="w-full h-64 flex justify-center">
          <PieChart width={300} height={250}>
            <Pie
              data={distributionData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={2}
              stroke="#000000"
            >
              {distributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{
                fontSize: "12px",
                lineHeight: "16px",
              }}
            />
          </PieChart>
        </div>
      </div>
    </div>
  );
}

export default PortfolioDistribution;
