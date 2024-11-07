import React from "react";
import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";

type RiskData = {
  name: string;
  value: number;
  color: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: RiskData;
  }>;
};

const riskData: RiskData[] = [
  { name: "Low Risk", value: 35, color: "#4ade80" },
  { name: "Medium Risk", value: 30, color: "#facc15" },
  { name: "High Risk", value: 25, color: "#fb923c" },
  { name: "Extreme Risk", value: 10, color: "#ef4444" },
];

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
          {data.name}: {data.value}%
        </p>
      </div>
    );
  }
  return null;
};

export function RiskChart() {
  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Risk Distribution</h2>
        <div className="w-full h-64 flex justify-center">
          <PieChart width={300} height={250}>
            <Pie
              data={riskData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={2}
              stroke="#000000"
            >
              {riskData.map((entry, index) => (
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

export default RiskChart;
