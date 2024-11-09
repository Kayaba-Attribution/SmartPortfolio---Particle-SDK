/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from "react";
// AA
import { useSmartAccountContext } from "../components/SmartAccountContext";
import addresses from "../contracts/addresses.json";
import SmartPortfolioABI from "../contracts/artifacts/SmartBasket.json";
import { type PortfolioDetails, usePortfolioContext } from "./PortfolioContext";
import { PortfolioPriceChart } from "../components/PortfolioPriceChart";
import { encodeFunctionData } from "viem";
import { useReadContract, useReadContracts } from "wagmi";

const GetUserPortfolios: React.FC = () => {
  const {
    refreshPortfolios,
    setRefreshPortfolios,
    setRefreshTokenBalances,
    setPortfolioDetails,
    portfolioDetails,
    formatValue,
    calculateROI,
    getTokenName,
  } = usePortfolioContext();

  const { smartAccountAddress: address, sendTransaction } = useSmartAccountContext();
  const [sellingPortfolioId, setSellingPortfolioId] = useState<number | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [sellSuccess, setSellSuccess] = useState(false);
  const [, setError] = useState<string>("");
  const [selectedPortfolioIndex, setSelectedPortfolioIndex] = useState<number | null>(null);

  // Function to handle modal open/close
  const openChartModal = (index: number) => {
    setSelectedPortfolioIndex(index);
    const modal = document.getElementById("chart-modal") as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  };

  const closeChartModal = () => {
    setSelectedPortfolioIndex(null);
    const modal = document.getElementById("chart-modal") as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
  };

  const {
    data: userPortfolios,
    isError,
    isLoading,
    refetch,
  } = useReadContract({
    address: addresses.core.SmartPortfolio as `0x${string}`,
    abi: SmartPortfolioABI.abi,
    functionName: "getUserBaskets",
    args: [address],
  });

  // Handle portfolio sale using AA
  const handleSellPortfolio = async (portfolioId: number) => {
    try {
      setIsSelling(true);
      setSellingPortfolioId(portfolioId);
      setError("");

      const data = encodeFunctionData({
        abi: SmartPortfolioABI.abi,
        functionName: "sellBasket",
        args: [portfolioId],
      });

      const hash = await sendTransaction({
        to: addresses.core.SmartPortfolio as `0x${string}`,
        data,
      });

      if (hash) {
        setSellSuccess(true);
        setRefreshPortfolios(true);
        setRefreshTokenBalances(true);
        await refetch();

        // Clear success message after delay
        setTimeout(() => {
          setSellSuccess(false);
        }, 5000);
      }
    } catch (err: any) {
      console.error("Error selling portfolio:", err);
      setError(err.message || "Failed to sell portfolio");
    } finally {
      setIsSelling(false);
      setSellingPortfolioId(null);
    }
  };

  useEffect(() => {
    if (refreshPortfolios) {
      refetch();
      setRefreshPortfolios(false);
      setRefreshTokenBalances(true);
    }
  }, [refreshPortfolios, refetch, setRefreshPortfolios, setRefreshTokenBalances]);

  const portfolioCount = Array.isArray(userPortfolios) ? userPortfolios.length : 0;

  const assetDetailsResults = useReadContracts({
    // @ts-ignore
    contracts: Array.from({ length: portfolioCount }, (_, i) => ({
      address: addresses.core.SmartPortfolio as `0x${string}`,
      abi: SmartPortfolioABI.abi,
      functionName: "getBasketAssetDetails",
      args: [address, i],
    })),
  });

  const totalValueResults = useReadContracts({
    // @ts-ignore
    contracts: Array.from({ length: portfolioCount }, (_, i) => ({
      address: addresses.core.SmartPortfolio as `0x${string}`,
      abi: SmartPortfolioABI.abi,
      functionName: "getBasketTotalValue",
      args: [address, i],
    })),
  });

  useEffect(() => {
    if (portfolioCount > 0 && assetDetailsResults.data && totalValueResults.data && Array.isArray(userPortfolios)) {
      const details: PortfolioDetails[] = assetDetailsResults.data.map((assetDetail, index) => {
        const [tokenAddresses, tokenPercentages, tokenAmounts, tokenValues] = assetDetail.result as [
          string[],
          bigint[],
          bigint[],
          bigint[],
        ];
        const totalValue = totalValueResults.data[index].result as bigint;
        const investmentValue = userPortfolios[index].investmentValue;

        return {
          tokenAddresses,
          tokenPercentages: tokenPercentages.map(p => Number(p)),
          tokenAmounts,
          tokenValues,
          investmentValue,
          totalValue,
        };
      });
      setPortfolioDetails(details);
    }
  }, [portfolioCount, assetDetailsResults.data, totalValueResults.data, userPortfolios, setPortfolioDetails]);

  if (isLoading || assetDetailsResults.isLoading || totalValueResults.isLoading) return <div>Loading...</div>;
  if (isError || assetDetailsResults.isError || totalValueResults.isError)
    return <div>Create some portfolios to see the details here.</div>;

  return (
    <div className="overflow-x-auto">
      <div className="flex">
        <h2 className="text-2xl font-semibold mb-4">Your Portfolios </h2>
        <div className="ml-4 badge badge-lg">Total: {portfolioCount}</div>
      </div>
      <table className="table w-full">
        <thead>
          <tr>
            <th>Tokens</th>
            <th>Amounts</th>
            <th>Values (USDT)</th>
            <th>Initial Investment</th>
            <th>Current Value</th>
            <th>ROI</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {portfolioDetails.map((portfolio, portfolioIndex) => (
            <tr key={portfolioIndex} className="border-purple-700">
              <td>
                <ul>
                  {portfolio.tokenAddresses.map((address, i) => (
                    <li key={i}>
                      ({portfolio.tokenPercentages[i]}%) - {getTokenName(address)}
                    </li>
                  ))}
                </ul>
              </td>
              <td>
                <ul>
                  {portfolio.tokenAmounts.map((amount, i) => (
                    <li key={i}>{formatValue(amount)}</li>
                  ))}
                </ul>
              </td>
              <td>
                <ul>
                  {portfolio.tokenValues.map((value, i) => (
                    <li key={i}>{formatValue(value)}</li>
                  ))}
                </ul>
              </td>
              <td>{formatValue(portfolio.investmentValue)} USDT</td>
              <td>{formatValue(portfolio.totalValue)} USDT</td>
              <td>
                <span
                  className={
                    Number(calculateROI(portfolio.totalValue, portfolio.investmentValue)) >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {calculateROI(portfolio.totalValue, portfolio.investmentValue)}%
                </span>
              </td>
              <td className="flex gap-2">
                {" "}
                {/* Added flex and gap */}
                <button
                  onClick={() => handleSellPortfolio(portfolioIndex)}
                  disabled={isSelling && sellingPortfolioId === portfolioIndex}
                  className="btn btn-primary btn-sm bg-red-500"
                >
                  {isSelling && sellingPortfolioId === portfolioIndex ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Sell"
                  )}
                </button>
                <button onClick={() => openChartModal(portfolioIndex)} className="btn btn-primary btn-sm">
                  📈 Chart
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Chart Modal */}
      <dialog id="chart-modal" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeChartModal}>
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg mb-4">Portfolio Performance</h3>
          <div className="w-full">
            {selectedPortfolioIndex !== null && <PortfolioPriceChart portfolioIndex={selectedPortfolioIndex} />}
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeChartModal}>close</button>
        </form>
      </dialog>

      {sellSuccess && (
        <div className="alert alert-success mt-4">
          <span>Portfolio sold successfully!</span>
        </div>
      )}
    </div>
  );
};

export default GetUserPortfolios;
