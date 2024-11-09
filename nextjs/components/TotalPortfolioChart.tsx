/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useRef } from "react";
import { usePortfolioContext } from "../app/PortfolioContext";
import { fetchTokenPrices, formatChartValue } from "../utils/scaffold-eth/priceUtils";
import { ColorType, IChartApi, UTCTimestamp, createChart } from "lightweight-charts";

interface ChartData {
  time: UTCTimestamp;
  value: number;
}

export const TotalPortfolioChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { portfolioDetails } = usePortfolioContext();

  useEffect(() => {
    if (!chartContainerRef.current || portfolioDetails.length === 0) return;

    const initChart = async () => {
      // Clean up previous chart
      if (chartRef.current) {
        chartRef.current.remove();
      }

      // Type guard for container
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

      // Fetch data for all portfolios
      const portfolioPrices = await Promise.all(
        portfolioDetails.map(portfolio => fetchTokenPrices(portfolio.tokenAddresses, portfolio.tokenAmounts)),
      );

      // Combine all portfolio data
      if (portfolioPrices.every(data => data !== null)) {
        const timestamps = portfolioPrices[0]!.map(point => point.time);

        // Sum up values for each timestamp
        const combinedData: ChartData[] = timestamps.map(time => {
          const totalValue = portfolioPrices.reduce((sum, portfolioData) => {
            const dataPoint = portfolioData!.find(point => point.time === time);
            return sum + (dataPoint?.value || 0);
          }, 0);

          return {
            time: time as UTCTimestamp,
            value: totalValue,
          };
        });

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

        series.setData(combinedData);
        chart.timeScale().fitContent();

        // Add tooltip
        chart.subscribeCrosshairMove(param => {
          if (!param.time || !param.point) {
            return;
          }

          const timestamp = param.time as UTCTimestamp;
          const dataPoint = combinedData.find(d => d.time === timestamp);
          if (dataPoint) {
            const tooltipEl = document.getElementById("total-chart-tooltip");
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
    return () => window.removeEventListener("resize", handleResize);
  }, [portfolioDetails]);

  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Total Portfolio Value (30 Days)</h2>
        <div className="relative w-full">
          <div ref={chartContainerRef} className="w-full h-[300px]" />
          <div id="total-chart-tooltip" className="absolute pointer-events-none" style={{ display: "none" }} />
        </div>
      </div>
    </div>
  );
};

export default TotalPortfolioChart;
