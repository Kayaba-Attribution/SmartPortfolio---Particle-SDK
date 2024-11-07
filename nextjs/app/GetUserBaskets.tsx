import React, { useEffect, useState } from "react";
import addresses from "../contracts/addresses.json";
import SmartPortfolioABI from "../contracts/artifacts/SmartBasket.json";
import { type PortfolioDetails, usePortfolioContext } from "./PortfolioContext";
import { useAccount, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

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

  const { address } = useAccount();
  const [sellingPortfolioId, setSellingPortfolioId] = useState<number | null>(null);

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

  // Sell Portfolio functionality
  const { writeContract: sellPortfolio, data: sellData } = useWriteContract();
  const { isLoading: isSelling, isSuccess: isSellSuccess } = useWaitForTransactionReceipt({
    hash: sellData,
  });

  const handleSellPortfolio = async (portfolioId: number) => {
    setSellingPortfolioId(portfolioId);
    sellPortfolio({
      address: addresses.core.SmartPortfolio as `0x${string}`,
      abi: SmartPortfolioABI.abi,
      functionName: "sellBasket",
      args: [portfolioId],
    });
  };

  useEffect(() => {
    if (isSellSuccess) {
      setRefreshPortfolios(true);
      setRefreshTokenBalances(true);
      refetch();
      setSellingPortfolioId(null);
    }
  }, [isSellSuccess, setRefreshPortfolios, setRefreshTokenBalances, refetch]);

  useEffect(() => {
    if (refreshPortfolios) {
      refetch();
      setRefreshPortfolios(false);
    }
  }, [refreshPortfolios, refetch, setRefreshPortfolios]);

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
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {portfolioDetails.map((portfolio, portfolioIndex) => (
            <tr key={portfolioIndex} className="border-blue-500">
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
              <td>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isSellSuccess && (
        <div className="alert alert-success mt-4">
          <span>Portfolio sold successfully!</span>
        </div>
      )}
    </div>
  );
};

export default GetUserPortfolios;
