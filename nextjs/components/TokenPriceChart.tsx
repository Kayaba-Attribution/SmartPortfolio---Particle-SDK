import React, { useEffect, useRef, useState } from "react";
import { AreaSeriesPartialOptions, ColorType, IChartApi, UTCTimestamp, createChart } from "lightweight-charts";

interface PriceData {
  timestamp: number;
  price: string;
}

interface ApiResponse {
  success: boolean;
  results: PriceData[];
}

interface TokenPriceChartProps {
  tokenAddress: string;
  tokenName: string;
  chainId?: number;
  initialTimeframe?: TimeframeOption;
}

interface ChartData {
  time: UTCTimestamp;
  value: number;
}

type TimeframeOption = "24h" | "7d" | "30d" | "180d" | "1y";

const timeframeOptions: { label: string; value: TimeframeOption }[] = [
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "180D", value: "180d" },
  { label: "1Y", value: "1y" },
];

const DEFAULT_COLORS = {
  positive: {
    line: "#4ade80",
    areaTop: "rgba(74, 222, 128, 0.4)",
    areaBottom: "rgba(74, 222, 128, 0)",
  },
  negative: {
    line: "#ef4444",
    areaTop: "rgba(239, 68, 68, 0.4)",
    areaBottom: "rgba(239, 68, 68, 0)",
  },
};

export const TokenPriceChart: React.FC<TokenPriceChartProps> = ({
  tokenAddress,
  tokenName,
  chainId = 1,
  initialTimeframe = "24h",
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>(initialTimeframe);
  const [priceChange, setPriceChange] = useState<{
    value: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `https://price-monitoring-hono.smart-portfolio-price-monitor.workers.dev/api/prices/${chainId}/${tokenAddress}/history?timeframe=${selectedTimeframe}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch price data");
        }

        const data: ApiResponse = await response.json();

        if (!data.success || !data.results?.length) {
          throw new Error("No price data available");
        }

        // Calculate price change
        const firstPrice = parseFloat(data.results[0].price);
        const lastPrice = parseFloat(data.results[data.results.length - 1].price);
        const absoluteChange = lastPrice - firstPrice;
        const percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;

        setPriceChange({
          value: absoluteChange,
          percentage: percentageChange,
        });

        if (chartContainerRef.current) {
          // Initialize chart if not already done
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
              crosshair: {
                vertLine: {
                  labelBackgroundColor: "#475569",
                },
                horzLine: {
                  labelBackgroundColor: "#475569",
                },
              },
            });
          }

          // Get colors based on price change
          const colors = (priceChange?.value ?? 0) >= 0 ? DEFAULT_COLORS.positive : DEFAULT_COLORS.negative;

          // Create series options
          const areaSeriesOptions: AreaSeriesPartialOptions = {
            lineColor: colors.line,
            topColor: colors.areaTop,
            bottomColor: colors.areaBottom,
            lineWidth: 2,
            priceFormat: {
              type: "price",
              precision: 6,
              minMove: 0.000001,
            },
          };

          // Create and style the area series
          const areaSeries = chart.current.addAreaSeries(areaSeriesOptions);

          // Format the data with proper typing
          const formattedData: ChartData[] = data.results.map(item => ({
            time: item.timestamp as number as UTCTimestamp,
            value: parseFloat(item.price),
          }));

          // Set the data and fit content
          areaSeries.setData(formattedData);
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
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chart data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tokenAddress, chainId, selectedTimeframe, priceChange?.value]);

  const handleTimeframeChange = (timeframe: TimeframeOption) => {
    setSelectedTimeframe(timeframe);
    // Chart will be updated by the useEffect
  };

  if (error) {
    return (
      <div className="card w-full bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="h-[300px] flex items-center justify-center text-error">{error}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <h2 className="card-title">{tokenName} Price Chart</h2>
              {priceChange && (
                <span className={`text-sm ${priceChange.value >= 0 ? "text-success" : "text-error"}`}>
                  {priceChange.value >= 0 ? "▲" : "▼"} {Math.abs(priceChange.percentage).toFixed(2)}%
                </span>
              )}
            </div>
            <div className="join">
              {timeframeOptions.map(option => (
                <button
                  key={option.value}
                  className={`join-item btn btn-sm ${selectedTimeframe === option.value ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => handleTimeframeChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
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

export default TokenPriceChart;
