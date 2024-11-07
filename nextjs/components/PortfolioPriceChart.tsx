import React, { useEffect, useRef, useState } from "react";
import { ColorType, IChartApi, LineStyle, UTCTimestamp, createChart } from "lightweight-charts";
import { usePortfolioContext } from "../app/PortfolioContext";

interface TokenPriceData {
  timestamp: number;
  price: string;
}

interface ApiResponse {
  success: boolean;
  results: TokenPriceData[];
}

interface PortfolioToken {
  address: string;
  symbol: string;
  percentage: number;
  color: string; // For consistent token colors
}

interface ChartData {
  time: UTCTimestamp;
  value: number;
  tokens: {
    [symbol: string]: {
      price: number;
      contribution: number; // Value considering allocation percentage
    };
  };
  total: number;
}

interface PortfolioPriceChartProps {
  tokens: PortfolioToken[];
  initialTimeframe?: TimeframeOption;
  portfolioId?: number;
}

type TimeframeOption = "24h" | "7d" | "30d" | "180d" | "1y";

const timeframeOptions = [
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "180D", value: "180d" },
  { label: "1Y", value: "1y" },
];

export const PortfolioPriceChart: React.FC<PortfolioPriceChartProps> = ({ tokens, initialTimeframe = "24h" }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>(initialTimeframe);
  const [portfolioChange, setPortfolioChange] = useState<{
    value: number;
    percentage: number;
  } | null>(null);

  const { portfolioDetails, formatValue, calculateROI, getTokenName } = usePortfolioContext();

  // Fetch price data for all tokens
  const fetchTokenPrices = async () => {
    try {
      const pricePromises = tokens.map(token =>
        fetch(
          `https://price-monitoring-hono.smart-portfolio-price-monitor.workers.dev/api/prices/1/${token.address}/history?timeframe=${selectedTimeframe}`,
        )
          .then(res => res.json())
          .then((data: ApiResponse) => ({
            symbol: token.symbol,
            data: data.results,
            percentage: token.percentage,
          })),
      );

      const results = await Promise.all(pricePromises);
      return results;
    } catch (error) {
      throw new Error("Failed to fetch token prices");
    }
  };

  const processData = (tokenPrices: Array<{ symbol: string; data: TokenPriceData[]; percentage: number }>) => {
    const combinedData = new Map<number, ChartData>();

    // Process each token's data
    tokenPrices.forEach(({ symbol, data, percentage }) => {
      data.forEach(({ timestamp, price }) => {
        const existingData = combinedData.get(timestamp) || {
          time: timestamp as UTCTimestamp,
          value: 0,
          tokens: {},
          total: 0,
        };

        const tokenPrice = parseFloat(price);
        // Calculate the token's contribution based on percentage
        const contribution = (tokenPrice * percentage) / 100;

        existingData.tokens[symbol] = {
          price: tokenPrice,
          contribution,
        };

        // Update total
        existingData.total = Object.values(existingData.tokens).reduce((sum, token) => sum + token.contribution, 0);

        combinedData.set(timestamp, existingData);
      });
    });

    return Array.from(combinedData.values()).sort((a, b) => (a.time as number) - (b.time as number));
  };

  useEffect(() => {
    const setupChart = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const tokenPrices = await fetchTokenPrices();
        const chartData = processData(tokenPrices);

        if (!chartContainerRef.current || !chartData.length) return;

        // Initialize chart
        if (!chart.current) {
          chart.current = createChart(chartContainerRef.current, {
            layout: {
              background: { type: ColorType.Solid, color: "transparent" },
              textColor: "#64748b",
            },
            grid: {
              vertLines: { color: "#334155" },
              horzLines: { color: "#334155" },
            },
            width: chartContainerRef.current.clientWidth,
            height: 300,
            timeScale: {
              timeVisible: true,
              secondsVisible: false,
              borderColor: "#334155",
            },
            rightPriceScale: {
              borderColor: "#334155",
              autoScale: true,
            },
          });
        }

        // Create individual series for each token
        tokens.forEach(token => {
          const areaSeries = chart.current!.addAreaSeries({
            topColor: `${token.color}40`,
            bottomColor: `${token.color}00`,
            lineColor: token.color,
            lineWidth: 1,
            priceFormat: {
              type: "price",
              precision: 2,
              minMove: 0.01,
            },
          });

          const tokenData = chartData.map(d => ({
            time: d.time,
            value: d.tokens[token.symbol]?.contribution || 0,
          }));

          areaSeries.setData(tokenData);
        });

        // Add total value line on top
        const lineSeries = chart.current.addLineSeries({
          color: "#ffffff",
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          priceFormat: {
            type: "price",
            precision: 2,
            minMove: 0.01,
          },
          title: "Total Value",
        });

        const totalData = chartData.map(d => ({
          time: d.time,
          value: d.total,
        }));

        lineSeries.setData(totalData);

        // Calculate portfolio change
        const firstValue = chartData[0].total;
        const lastValue = chartData[chartData.length - 1].total;
        const absoluteChange = lastValue - firstValue;
        const percentageChange = ((lastValue - firstValue) / firstValue) * 100;

        setPortfolioChange({
          value: absoluteChange,
          percentage: percentageChange,
        });

        chart.current.timeScale().fitContent();

        // Handle resize
        const handleResize = () => {
          if (chartContainerRef.current && chart.current) {
            chart.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
            });
          }
        };

        window.addEventListener("resize", handleResize);
        return () => {
          window.removeEventListener("resize", handleResize);
          if (chart.current) {
            chart.current.remove();
            chart.current = null;
          }
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chart data");
      } finally {
        setIsLoading(false);
      }
    };

    setupChart();
  }, [tokens, selectedTimeframe]);

  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <h2 className="card-title">Portfolio Performance</h2>
                {portfolioChange && (
                  <span className={`ml-2 badge ${portfolioChange.value >= 0 ? "badge-success" : "badge-error"}`}>
                    {portfolioChange.value >= 0 ? "▲" : "▼"} {Math.abs(portfolioChange.percentage).toFixed(2)}%
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center text-sm">
                Total Value Line
                <div className="w-4 h-0.5 bg-white"></div>
                {tokens.map(token => (
                  <div key={token.symbol} className="flex items-center gap-1">
                    {token.symbol}: {token.percentage}%
                    <div className="w-4 h-0.5" style={{ backgroundColor: token.color }}></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="join">
              {timeframeOptions.map(option => (
                <button
                  key={option.value}
                  className={`join-item btn btn-sm ${selectedTimeframe === option.value ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setSelectedTimeframe(option.value as TimeframeOption)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="relative w-full h-[300px]">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-base-100/50">
                <div className="loading loading-spinner loading-lg"></div>
              </div>
            )}
            <div ref={chartContainerRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPriceChart;
