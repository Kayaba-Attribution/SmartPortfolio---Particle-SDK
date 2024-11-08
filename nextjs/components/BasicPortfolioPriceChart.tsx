/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useRef, useState } from "react";
import { usePortfolioContext } from "../app/PortfolioContext";
import { ColorType, CrosshairMode, IChartApi, UTCTimestamp, createChart } from "lightweight-charts";

interface PriceData {
  timestamp: number;
  price: string;
}

interface ApiResponse {
  success: boolean;
  results: PriceData[];
}

interface PortfolioPriceChartProps {
  portfolioIndex: number;
  test?: boolean;
}

interface TokenFetchError {
  address: string;
  symbol: string;
  error: string;
}

interface TokenResult {
  success: boolean;
  symbol?: string;
  percentage?: number;
  data: PriceData[];
}

interface ChartTimePoint {
  time: UTCTimestamp;
  total: number;
  tokens: {
    symbol: string;
    value: number;
    percentage: number;
  }[];
}

const generateTestData = (basePrice: number, dataPoints = 24): PriceData[] => {
  const now = Math.floor(Date.now() / 1000);
  const hourInSeconds = 3600;
  const volatility = 0.02;

  return Array.from({ length: dataPoints }, (_, i) => {
    const timestamp = now - (dataPoints - i) * hourInSeconds;
    const randomChange = 1 + (Math.random() - 0.5) * volatility;
    const price = (basePrice * randomChange).toFixed(6);

    return {
      timestamp,
      price,
    };
  });
};

export const BasicPortfolioPriceChart: React.FC<PortfolioPriceChartProps> = ({ portfolioIndex, test = false }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<TokenFetchError[]>([]);
  const { portfolioDetails, getTokenName } = usePortfolioContext();

  const cleanupChart = () => {
    if (chart.current) {
      chart.current.remove();
      chart.current = null;
    }
  };

  const formatTokenList = (portfolio: any) => {
    if (!portfolio) return "";
    return portfolio.tokenAddresses
      .map((address: string, index: number) => `${getTokenName(address)} (${portfolio.tokenPercentages[index]}%)`)
      .join(" + ");
  };

  useEffect(() => {
    // Cleanup previous chart instance
    cleanupChart();

    const fetchPortfolioData = async () => {
      try {
        setIsLoading(true);
        setErrors([]);

        const portfolio = portfolioDetails[portfolioIndex];
        if (!portfolio) {
          throw new Error("Portfolio not found");
        }

        const tokenResults = await Promise.all(
          portfolio.tokenAddresses.map(async (address, index): Promise<TokenResult> => {
            try {
              let data: ApiResponse;

              if (test) {
                const currentValue = Number(portfolio.tokenValues[index]) / 10 ** 18;
                data = {
                  success: true,
                  results: generateTestData(currentValue),
                };
              } else {
                const response = await fetch(
                  `https://price-monitoring-hono.smart-portfolio-price-monitor.workers.dev/api/prices/1/${address}/history?timeframe=24h`,
                );

                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }

                data = await response.json();
              }

              if (!data.success || !data.results?.length) {
                throw new Error("No price data available");
              }

              return {
                success: true,
                symbol: getTokenName(address),
                percentage: portfolio.tokenPercentages[index],
                data: data.results,
              };
            } catch (error) {
              setErrors(prev => [
                ...prev,
                {
                  address,
                  symbol: getTokenName(address),
                  error: error instanceof Error ? error.message : "Failed to fetch price data",
                },
              ]);

              return { success: false, data: [] };
            }
          }),
        );

        if (tokenResults.every(result => !result.success)) {
          throw new Error("Failed to fetch price data for all tokens");
        }

        // Process data points
        const timeMap = new Map<number, ChartTimePoint>();

        tokenResults.forEach(result => {
          if (!result.success || !result.symbol || !result.percentage || !result.symbol) return;

          result.data.forEach(({ timestamp, price }) => {
            const existingPoint = timeMap.get(timestamp) || {
              time: timestamp as UTCTimestamp,
              total: 0,
              tokens: [],
            };

            if (!result.percentage || !result.symbol) return;

            const value = parseFloat(price) * (result.percentage / 100);
            existingPoint.total += value;
            existingPoint.tokens.push({
              symbol: result.symbol,
              value,
              percentage: result.percentage,
            });

            timeMap.set(timestamp, existingPoint);
          });
        });

        const points = Array.from(timeMap.values()).sort((a, b) => (a.time as number) - (b.time as number));

        if (!chartContainerRef.current) return;

        // Create new chart instance
        const newChart = createChart(chartContainerRef.current, {
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
          crosshair: {
            mode: CrosshairMode.Normal,
            vertLine: {
              labelVisible: false,
            },
            horzLine: {
              labelVisible: false,
            },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
        });

        chart.current = newChart;

        chart.current.applyOptions({
          watermark: {
            visible: true,
            fontSize: 16,
            horzAlign: "left",
            vertAlign: "top",
            color: "rgba(171, 71, 188, 0.5)",
            text: "SmartPortfolio",
          },
        });

        const series = chart.current.addAreaSeries({
          lineColor: "#4ade80",
          topColor: "rgba(74, 222, 128, 0.4)",
          bottomColor: "rgba(74, 222, 128, 0)",
          priceFormat: {
            type: "price",
            precision: 2,
            minMove: 0.01,
          },
        });

        const chartData = points.map(point => ({
          time: point.time,
          value: point.total,
        }));

        series.setData(chartData);

        // Subscribe to crosshair move for tooltip
        chart.current.subscribeCrosshairMove(param => {
          if (!tooltipRef.current) return;

          if (
            param.point === undefined ||
            !param.time ||
            param.point.x < 0 ||
            param.point.x > chartContainerRef.current!.clientWidth ||
            param.point.y < 0 ||
            param.point.y > chartContainerRef.current!.clientHeight
          ) {
            tooltipRef.current.style.display = "none";
            return;
          }

          const dateStr = new Date((param.time as number) * 1000).toLocaleString();
          const pointData = points.find(p => p.time === param.time);

          if (pointData) {
            tooltipRef.current.style.display = "block";
            tooltipRef.current.style.left = `${param.point.x}px`;
            tooltipRef.current.style.top = `${param.point.y}px`;
            tooltipRef.current.innerHTML = `
              <div class="font-medium">${dateStr}</div>
              <div class="text-lg font-bold">Total: $${pointData.total.toFixed(2)}</div>
              ${pointData.tokens
                .map(
                  token => `
                <div class="text-sm">
                  ${token.symbol}: $${token.value.toFixed(2)} (${token.percentage}%)
                </div>
              `,
                )
                .join("")}
            `;
          }
        });

        chart.current.timeScale().fitContent();

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
        setErrors(prev => [
          ...prev,
          {
            address: "portfolio",
            symbol: "Portfolio",
            error: err instanceof Error ? err.message : "Failed to load portfolio data",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioData();
  }, [portfolioIndex, portfolioDetails, getTokenName, test]);

  const ErrorDisplay = () => {
    if (!errors.length) return null;

    return (
      <div className="mt-4 space-y-2">
        <h3 className="text-error font-semibold">Errors:</h3>
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="text-sm text-error">
              {error.symbol}: {error.error}
            </div>
          ))}
        </div>
        {errors.length < portfolioDetails[portfolioIndex]?.tokenAddresses.length && (
          <p className="text-sm text-warning">Showing partial data. Some token prices could not be loaded.</p>
        )}
      </div>
    );
  };

  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div className="flex flex-col md:flex-row justify-center items-center gap-1">
            <h2 className="card-title">Portfolio {portfolioIndex + 1} Value</h2>
            {portfolioDetails[portfolioIndex] && <div>{portfolioDetails[portfolioIndex].totalValue}</div>}
            <div className="text-sm opacity-70 ml-">{formatTokenList(portfolioDetails[portfolioIndex])}</div>
          </div>
          {errors.length > 0 && (
            <div className="badge badge-error gap-2">
              {errors.length} Error{errors.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div className="relative w-full">
          {!errors.length && (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-100/50">
                  <div className="loading loading-spinner loading-lg"></div>
                </div>
              )}
              <div ref={chartContainerRef} className="w-full h-[300px]" />
              <div
                ref={tooltipRef}
                className="absolute hidden p-2 rounded shadow-lg bg-base-200 text-base-content border border-base-300 z-50 transform -translate-x-1/2 -translate-y-full"
              />
            </>
          )}

          {errors.length === portfolioDetails[portfolioIndex]?.tokenAddresses.length && (
            <div className="flex items-center justify-center py-4">
              <div className="text-error text-center">Failed to load price data for all tokens</div>
            </div>
          )}
        </div>

        <ErrorDisplay />
      </div>
    </div>
  );
};

export default BasicPortfolioPriceChart;
