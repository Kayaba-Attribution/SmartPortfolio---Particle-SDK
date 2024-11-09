import React, { useEffect, useRef, useState } from "react";
import { usePortfolioContext } from "../app/PortfolioContext";
import { fetchTokenPrices, formatChartValue } from "../utils/scaffold-eth/priceUtils";
import { ColorType, IChartApi, UTCTimestamp, createChart } from "lightweight-charts";

interface PortfolioPriceChartProps {
  portfolioIndex: number;
}

interface ChartData {
  time: UTCTimestamp;
  value: number;
}

export const PortfolioPriceChart: React.FC<PortfolioPriceChartProps> = ({ portfolioIndex }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { portfolioDetails } = usePortfolioContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const portfolio = portfolioDetails[portfolioIndex];
    if (!portfolio || !chartContainerRef.current) return;

    const initChart = async () => {
      try {
        // Clean up previous chart
        if (chartRef.current) {
          chartRef.current.remove();
        }

        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!chartContainerRef.current) return;

        // Create new chart
        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "#64748b",
          },
          width: chartContainerRef.current.clientWidth,
          height: 300,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
        });

        chartRef.current = chart;

        // Fetch and set up data
        const rawPriceData = await fetchTokenPrices(portfolio.tokenAddresses, portfolio.tokenAmounts, 7);

        if (rawPriceData) {
          const priceData: ChartData[] = rawPriceData.map(point => ({
            time: point.time as UTCTimestamp,
            value: point.value,
          }));

          const series = chart.addAreaSeries({
            lineColor: "#E44BE0",
            topColor: "rgba(228, 75, 224, 0.3)",
            bottomColor: "rgba(74, 222, 128, 0)",
            lineWidth: 3,
            priceLineVisible: false,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 6,
            priceFormat: {
              type: "custom",
              formatter: (price: number) => formatChartValue(price),
            },
          });

          series.setData(priceData);
          chart.timeScale().fitContent();

          // Add tooltip
          chart.subscribeCrosshairMove(param => {
            if (!param.time || !param.point) return;

            const timestamp = param.time as UTCTimestamp;
            const dataPoint = priceData.find(d => d.time === timestamp);
            if (dataPoint) {
              const tooltipEl = document.getElementById(`chart-tooltip-${portfolioIndex}`);
              if (tooltipEl) {
                tooltipEl.style.display = "block";
                tooltipEl.style.left = `${param.point.x}px`;
                tooltipEl.style.top = `${param.point.y}px`;
                tooltipEl.innerHTML = `
                  <div class="bg-base-200 p-2 rounded shadow">
                    <div>${new Date(timestamp * 1000).toLocaleDateString()}</div>
                    <div class="font-bold">${formatChartValue(dataPoint.value)}</div>
                  </div>
                `;
              }
            }
          });
        }
        setIsLoading(false);
      } catch (e) {
        console.warn("Chart initialization error:", e);
        // Try once more after a short delay
        setTimeout(initChart, 200);
      }
    };

    initChart();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [portfolioIndex, portfolioDetails]);

  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Portfolio {portfolioIndex + 1} Value (7 Days)</h2>
        <div className="relative w-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-base-100 bg-opacity-50">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          )}
          <div ref={chartContainerRef} className="w-full h-[300px]" />
          <div
            id={`chart-tooltip-${portfolioIndex}`}
            className="absolute pointer-events-none"
            style={{ display: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default PortfolioPriceChart;
